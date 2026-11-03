// Path: ums-app/src-tauri/src/lib.rs
// Purpose: Tauri backend supporting keyring-based FileLu credentials, per-user sync lifecycle, and streaming uploads.

use aws_config::BehaviorVersion;
use aws_sdk_s3::config::{
    Credentials, Region, RequestChecksumCalculation, ResponseChecksumValidation,
};
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client;
use chrono::Local;
use keyring::Entry;
use notify::{RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{Emitter, Manager, State};
use walkdir::WalkDir;

// --- KEYRING ---
const KEYRING_SERVICE: &str = "com.petro-malamule.ums-app";
const KEYRING_ACCESS: &str = "filelu_access_key";
const KEYRING_SECRET: &str = "filelu_secret_key";
const KEYRING_ENDPOINT: &str = "filelu_endpoint";
const KEYRING_BUCKET: &str = "filelu_bucket";

fn keyring_entry(name: &str) -> Result<Entry, String> {
    Entry::new(KEYRING_SERVICE, name).map_err(|e| format!("Keyring init failed: {}", e))
}

fn get_credential(name: &str) -> Result<String, String> {
    keyring_entry(name)?
        .get_password()
        .map_err(|e| format!("Keyring get '{}' failed: {}", name, e))
}

fn set_credential(name: &str, value: &str) -> Result<(), String> {
    keyring_entry(name)?
        .set_password(value)
        .map_err(|e| format!("Keyring set '{}' failed: {}", name, e))
}

fn delete_credential(name: &str) {
    if let Ok(entry) = keyring_entry(name) {
        let _ = entry.delete_credential();
    }
}

fn get_credential_or_env(keyring_name: &str, env_name: &str) -> Result<String, String> {
    if let Ok(v) = get_credential(keyring_name) {
        if !v.is_empty() {
            return Ok(v);
        }
    }
    std::env::var(env_name).map_err(|_| {
        format!(
            "Missing credential '{}' (not in keyring, not in env '{}')",
            keyring_name, env_name
        )
    })
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct S3Object {
    pub key: String,
    pub size: u64,
    pub is_folder: bool,
    pub last_modified: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SyncConfig {
    pub local_path: String,
    pub sync_target_prefix: String,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct CredentialStatus {
    pub access_key_set: bool,
    pub secret_key_set: bool,
    pub endpoint_set: bool,
    pub bucket_set: bool,
    pub all_set: bool,
}

pub struct AppState {
    pub watchers: Mutex<HashMap<String, notify::RecommendedWatcher>>,
}

fn log(msg: &str) {
    println!("[{}] {}", Local::now().format("%H:%M:%S"), msg);
}

fn sanitize_prefix(prefix: &str) -> String {
    if prefix.is_empty() || prefix.ends_with('/') {
        prefix.to_string()
    } else {
        format!("{}/", prefix)
    }
}

async fn get_s3_client() -> Result<(Client, String), String> {
    let _ = dotenvy::from_filename("../.env");
    let _ = dotenvy::from_filename(".env");

    let access_key = get_credential_or_env(KEYRING_ACCESS, "FILELU_ACCESS_KEY")?;
    let secret_key = get_credential_or_env(KEYRING_SECRET, "FILELU_SECRET_KEY")?;
    let endpoint = get_credential_or_env(KEYRING_ENDPOINT, "FILELU_ENDPOINT")
        .unwrap_or_else(|_| "https://eu.s5lu.com".to_string());
    let bucket = get_credential_or_env(KEYRING_BUCKET, "FILELU_BUCKET")
        .unwrap_or_else(|_| "ums-prod".to_string());

    let creds = Credentials::new(access_key, secret_key, None, None, "filelu");
    let config = aws_sdk_s3::Config::builder()
        .behavior_version(BehaviorVersion::latest())
        .credentials_provider(creds)
        .region(Region::new("eu-central"))
        .endpoint_url(endpoint)
        .force_path_style(true)
        .request_checksum_calculation(RequestChecksumCalculation::WhenRequired)
        .response_checksum_validation(ResponseChecksumValidation::WhenRequired)
        .build();

    Ok((Client::from_conf(config), bucket))
}

// --- FILELU CREDENTIALS ---

#[tauri::command]
async fn set_filelu_credentials(
    access_key: String,
    secret_key: String,
    endpoint: String,
    bucket: String,
) -> Result<(), String> {
    if access_key.trim().is_empty() || secret_key.trim().is_empty() {
        return Err("Access key and secret key are required".to_string());
    }
    let endpoint_final = if endpoint.trim().is_empty() {
        "https://eu.s5lu.com".to_string()
    } else {
        endpoint
    };
    let bucket_final = if bucket.trim().is_empty() {
        "ums-prod".to_string()
    } else {
        bucket
    };
    set_credential(KEYRING_ACCESS, access_key.trim())?;
    set_credential(KEYRING_SECRET, secret_key.trim())?;
    set_credential(KEYRING_ENDPOINT, &endpoint_final)?;
    set_credential(KEYRING_BUCKET, &bucket_final)?;
    log("FileLu credentials stored in keyring");
    Ok(())
}

#[tauri::command]
async fn get_filelu_credentials_status() -> Result<CredentialStatus, String> {
    let has = |name: &str| -> bool { get_credential(name).map(|v| !v.is_empty()).unwrap_or(false) };
    let access_key_set = has(KEYRING_ACCESS);
    let secret_key_set = has(KEYRING_SECRET);
    let endpoint_set = has(KEYRING_ENDPOINT);
    let bucket_set = has(KEYRING_BUCKET);
    Ok(CredentialStatus {
        access_key_set,
        secret_key_set,
        endpoint_set,
        bucket_set,
        all_set: access_key_set && secret_key_set,
    })
}

#[tauri::command]
async fn clear_filelu_credentials() -> Result<(), String> {
    delete_credential(KEYRING_ACCESS);
    delete_credential(KEYRING_SECRET);
    delete_credential(KEYRING_ENDPOINT);
    delete_credential(KEYRING_BUCKET);
    log("FileLu credentials cleared");
    Ok(())
}

// --- CONFIG ---

fn get_config_path(app: &tauri::AppHandle) -> PathBuf {
    let mut path = app.path().app_config_dir().unwrap_or_else(|_| PathBuf::from("."));
    path.push("sync_configs.json");
    path
}

#[tauri::command]
fn get_all_sync_configs(app: tauri::AppHandle) -> Vec<SyncConfig> {
    let path = get_config_path(&app);
    if let Ok(content) = std::fs::read_to_string(path) {
        if let Ok(configs) = serde_json::from_str::<Vec<SyncConfig>>(&content) {
            return configs;
        }
    }
    vec![]
}

fn write_all_sync_configs(app: &tauri::AppHandle, configs: &[SyncConfig]) -> Result<(), String> {
    let path = get_config_path(app);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(configs).map_err(|e| e.to_string())?;
    std::fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

fn stop_watcher_for_prefix(state: &State<'_, AppState>, prefix: &str) {
    let mut guard = state.watchers.lock().unwrap();
    if guard.remove(prefix).is_some() {
        log(&format!("Stopped watcher for prefix: {}", prefix));
    }
}

#[tauri::command]
async fn save_sync_config(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    local_path: String,
    sync_target_prefix: String,
) -> Result<(), String> {
    let safe_target = sanitize_prefix(&sync_target_prefix);

    let mut configs = get_all_sync_configs(app.clone());
    configs.retain(|c| c.sync_target_prefix != safe_target);
    configs.push(SyncConfig {
        local_path: local_path.clone(),
        sync_target_prefix: safe_target.clone(),
        enabled: true,
    });
    write_all_sync_configs(&app, &configs)?;

    stop_watcher_for_prefix(&state, &safe_target);
    start_watcher(app.clone(), state, local_path.clone(), safe_target.clone())?;

    let app_clone = app.clone();
    let target_clone = safe_target.clone();
    tauri::async_runtime::spawn(async move {
        let _ = perform_initial_sync(app_clone, local_path, target_clone).await;
    });

    Ok(())
}

// --- WATCHER LIFECYCLE ---

#[tauri::command]
async fn start_sync_for_user(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    user_path: String,
) -> Result<bool, String> {
    let safe_target = sanitize_prefix(&user_path);
    let configs = get_all_sync_configs(app.clone());
    let config = match configs
        .into_iter()
        .find(|c| c.sync_target_prefix == safe_target && c.enabled)
    {
        Some(c) => c,
        None => return Ok(false),
    };

    {
        let guard = state.watchers.lock().unwrap();
        if guard.contains_key(&safe_target) {
            return Ok(true);
        }
    }

    start_watcher(
        app.clone(),
        state,
        config.local_path.clone(),
        safe_target.clone(),
    )?;

    let app_clone = app.clone();
    let local_path = config.local_path.clone();
    tauri::async_runtime::spawn(async move {
        let _ = perform_initial_sync(app_clone, local_path, safe_target).await;
    });

    Ok(true)
}

#[tauri::command]
async fn stop_sync_for_user(
    state: State<'_, AppState>,
    user_path: String,
) -> Result<(), String> {
    let safe_target = sanitize_prefix(&user_path);
    stop_watcher_for_prefix(&state, &safe_target);
    Ok(())
}

// --- WATCHER ---

fn start_watcher(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    path_str: String,
    target_prefix: String,
) -> Result<(), String> {
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<PathBuf>();

    let mut watcher = notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
        if let Ok(event) = res {
            if matches!(
                event.kind,
                notify::EventKind::Create(_) | notify::EventKind::Modify(_)
            ) {
                for path in event.paths {
                    let _ = tx.send(path);
                }
            }
        }
    })
    .map_err(|e| e.to_string())?;

    watcher
        .watch(Path::new(&path_str), RecursiveMode::Recursive)
        .map_err(|e| format!("Failed to watch folder: {}", e))?;

    {
        let mut guard = state.watchers.lock().unwrap();
        guard.insert(target_prefix.clone(), watcher);
    }

    let app_handle = app.clone();
    let base_path = PathBuf::from(&path_str);
    let target_prefix_clone = target_prefix.clone();

    tauri::async_runtime::spawn(async move {
        while let Some(path) = rx.recv().await {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                if name.starts_with("~$") || name.ends_with(".tmp") || name == ".DS_Store" {
                    continue;
                }
            }

            let app_task = app_handle.clone();
            let base_task = base_path.clone();
            let target_task = target_prefix_clone.clone();
            let path_task = path.clone();

            tauri::async_runtime::spawn(async move {
                handle_watcher_event(app_task, base_task, target_task, path_task).await;
            });
        }
    });

    log(&format!("Started watching: {} -> {}", path_str, target_prefix));
    Ok(())
}

async fn handle_watcher_event(
    app_handle: tauri::AppHandle,
    base_path: PathBuf,
    target_prefix: String,
    path: PathBuf,
) {
    let rel_path = match path.strip_prefix(&base_path) {
        Ok(p) => p.to_path_buf(),
        Err(_) => return,
    };
    let rel_str = rel_path.to_string_lossy().replace("\\", "/");
    let full_s3_key = format!("{}{}", target_prefix, rel_str);

    if path.is_dir() {
        let key = format!("{}/", full_s3_key);
        if let Ok((client, bucket)) = get_s3_client().await {
            let _ = client
                .put_object()
                .bucket(bucket)
                .key(&key)
                .body(ByteStream::from_static(b""))
                .send()
                .await;
        }
    } else if path.is_file() {
        let _ = app_handle.emit(
            "sync-status",
            serde_json::json!({
                "file": rel_str,
                "status": "waiting",
                "message": "Waiting 60s for OS to release file lock..."
            }),
        );

        tokio::time::sleep(Duration::from_secs(60)).await;

        let mut retries = 5;
        let mut success = false;

        while retries > 0 && !success {
            match ByteStream::from_path(&path).await {
                Ok(body) => {
                    if let Ok((client, bucket)) = get_s3_client().await {
                        let _ = app_handle.emit(
                            "sync-status",
                            serde_json::json!({ "file": rel_str, "status": "uploading" }),
                        );

                        match client
                            .put_object()
                            .bucket(bucket)
                            .key(&full_s3_key)
                            .body(body)
                            .content_type("application/octet-stream")
                            .send()
                            .await
                        {
                            Ok(_) => {
                                log(&format!("Local Sync complete: {}", full_s3_key));
                                let _ = app_handle.emit(
                                    "sync-status",
                                    serde_json::json!({ "file": rel_str, "status": "success" }),
                                );
                                success = true;
                            }
                            Err(e) => {
                                log(&format!("Upload failed: {:?}", e));
                                let _ = app_handle.emit(
                                    "sync-status",
                                    serde_json::json!({
                                        "file": rel_str,
                                        "status": "error",
                                        "message": format!("Upload failed: {}", e)
                                    }),
                                );
                            }
                        }
                    }
                }
                Err(_e) => {
                    let _ = app_handle.emit(
                        "sync-status",
                        serde_json::json!({
                            "file": rel_str,
                            "status": "locked",
                            "message": format!("File locked. Retrying in 2 mins. ({} attempts left)", retries)
                        }),
                    );

                    retries -= 1;
                    if retries > 0 {
                        tokio::time::sleep(Duration::from_secs(120)).await;
                    } else {
                        let _ = app_handle.emit(
                            "sync-status",
                            serde_json::json!({
                                "file": rel_str,
                                "status": "error",
                                "message": "Failed after 5 attempts. File permanently locked."
                            }),
                        );
                    }
                }
            }
        }
    }
}

async fn upload_local_file(
    app: tauri::AppHandle,
    local_file_path: String,
    s3_key: String,
) -> Result<(), String> {
    let result = async {
        let (client, bucket) = get_s3_client().await?;
        let body = ByteStream::from_path(&local_file_path)
            .await
            .map_err(|e| format!("Open error: {}", e))?;

        client
            .put_object()
            .bucket(bucket)
            .key(&s3_key)
            .body(body)
            .content_type("application/octet-stream")
            .send()
            .await
            .map_err(|e| format!("Upload failed: {:?}", e))?;

        Ok::<(), String>(())
    }
    .await;

    match result {
        Ok(_) => {
            log(&format!("Upload complete: {}", s3_key));
            let _ = app.emit("upload-success", s3_key);
            Ok(())
        }
        Err(e) => {
            log(&format!("Upload error: {}", e));
            let _ = app.emit("upload-error", e.clone());
            Err(e)
        }
    }
}

async fn perform_initial_sync(
    app: tauri::AppHandle,
    local_path: String,
    target_prefix: String,
) -> Result<(), String> {
    log(&format!("Starting initial directory sync for {}", target_prefix));
    let base_path = PathBuf::from(&local_path);

    for entry in WalkDir::new(&base_path).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();

        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if name.starts_with("~$") || name.ends_with(".tmp") || name == ".DS_Store" {
                continue;
            }
        }

        if let Ok(rel_path) = path.strip_prefix(&base_path) {
            let rel_str = rel_path.to_string_lossy().replace("\\", "/");
            let full_s3_key = format!("{}{}", target_prefix, rel_str);

            if path.is_dir() {
                let key = format!("{}/", full_s3_key);
                if let Ok((client, bucket)) = get_s3_client().await {
                    let _ = client
                        .put_object()
                        .bucket(bucket)
                        .key(&key)
                        .body(ByteStream::from_static(b""))
                        .send()
                        .await;
                }
            } else if path.is_file() {
                let _ =
                    upload_local_file(app.clone(), path.to_string_lossy().to_string(), full_s3_key)
                        .await;
            }
        }
    }
    log("Initial sync finished.");
    Ok(())
}

// --- STORAGE USAGE ---

#[tauri::command]
async fn get_storage_usage() -> Result<u64, String> {
    let (client, bucket) = get_s3_client().await?;
    let mut total_size = 0u64;
    let mut continuation_token: Option<String> = None;

    loop {
        let mut req = client.list_objects_v2().bucket(&bucket);
        if let Some(token) = &continuation_token {
            req = req.continuation_token(token);
        }

        let resp = req.send().await.map_err(|e| e.to_string())?;

        if let Some(contents) = resp.contents {
            for obj in contents {
                total_size += obj.size.unwrap_or(0) as u64;
            }
        }

        if resp.is_truncated == Some(true) {
            continuation_token = resp.next_continuation_token;
        } else {
            break;
        }
    }
    Ok(total_size)
}

// --- STORAGE ---

#[tauri::command]
async fn list_files(prefix: Option<String>) -> Result<Vec<S3Object>, String> {
    let raw_prefix = prefix.unwrap_or_else(|| "".to_string());
    let search_prefix = sanitize_prefix(&raw_prefix);
    let (client, bucket) = get_s3_client().await?;
    let resp = client
        .list_objects_v2()
        .bucket(bucket)
        .prefix(&search_prefix)
        .delimiter("/")
        .send()
        .await
        .map_err(|e| format!("Failed to connect to FileLu: {}", e))?;
    let mut objects = Vec::new();
    if let Some(prefixes) = resp.common_prefixes {
        for p in prefixes {
            if let Some(p_prefix) = p.prefix {
                let display_name = p_prefix
                    .strip_prefix(&search_prefix)
                    .unwrap_or(&p_prefix)
                    .to_string();
                if !display_name.is_empty() {
                    objects.push(S3Object {
                        key: p_prefix,
                        size: 0,
                        is_folder: true,
                        last_modified: None,
                    });
                }
            }
        }
    }
    if let Some(contents) = resp.contents {
        for object in contents {
            let last_mod = object.last_modified().map(|dt| dt.to_string());
            let size = object.size.unwrap_or(0) as u64;
            if let Some(key) = object.key {
                if key == search_prefix {
                    continue;
                }
                let normalized_key = key.trim_end_matches('/');
                let has_extension = normalized_key.split('/').last().unwrap_or("").contains('.');
                let is_folder = key.ends_with('/') || (size == 0 && !has_extension);
                if is_folder {
                    let exists = objects
                        .iter()
                        .any(|o| o.key.trim_end_matches('/') == normalized_key);
                    if exists {
                        continue;
                    }
                    objects.push(S3Object {
                        key: format!("{}/", normalized_key),
                        size: 0,
                        is_folder: true,
                        last_modified: last_mod,
                    });
                } else {
                    objects.push(S3Object {
                        key,
                        size,
                        is_folder: false,
                        last_modified: last_mod,
                    });
                }
            }
        }
    }
    Ok(objects)
}

#[tauri::command]
async fn create_folder(folder_name: String, current_prefix: String) -> Result<(), String> {
    let safe_prefix = sanitize_prefix(&current_prefix);
    let key = format!("{}{}/", safe_prefix, folder_name);
    let (client, bucket) = get_s3_client().await?;
    client
        .put_object()
        .bucket(bucket)
        .key(&key)
        .body(ByteStream::from_static(b""))
        .send()
        .await
        .map_err(|e| format!("Failed to create folder: {:?}", e))?;
    Ok(())
}

#[tauri::command]
async fn delete_object(key: String) -> Result<(), String> {
    let (client, bucket) = get_s3_client().await?;
    client
        .delete_object()
        .bucket(bucket)
        .key(&key)
        .send()
        .await
        .map_err(|e| format!("Failed to delete object: {:?}", e))?;
    Ok(())
}

#[tauri::command]
async fn get_share_url(key: String) -> Result<String, String> {
    let (client, bucket) = get_s3_client().await?;
    let presigning_config = aws_sdk_s3::presigning::PresigningConfig::builder()
        .expires_in(Duration::from_secs(3600))
        .build()
        .map_err(|e| format!("Failed to build presigning config: {}", e))?;
    let presigned_req = client
        .get_object()
        .bucket(bucket)
        .key(key)
        .presigned(presigning_config)
        .await
        .map_err(|e| format!("Failed to generate URL: {:?}", e))?;
    Ok(presigned_req.uri().to_string())
}

#[tauri::command]
async fn upload_file(
    app: tauri::AppHandle,
    file_path: String,
    current_prefix: String,
) -> Result<(), String> {
    let safe_prefix = sanitize_prefix(&current_prefix);
    let file_name = Path::new(&file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("Invalid file name")?
        .to_string();
    let key = format!("{}{}", safe_prefix, file_name);

    tauri::async_runtime::spawn(async move {
        let _ = upload_local_file(app, file_path, key).await;
    });
    Ok(())
}

#[tauri::command]
async fn download_file(app: tauri::AppHandle, key: String) -> Result<String, String> {
    let (client, bucket) = get_s3_client().await?;
    let resp = client
        .get_object()
        .bucket(bucket)
        .key(&key)
        .send()
        .await
        .map_err(|e| format!("Download failed: {:?}", e))?;
    let bytes = resp
        .body
        .collect()
        .await
        .map_err(|e| format!("Failed to read body: {}", e))?
        .into_bytes();
    let file_name = key.split('/').last().unwrap_or("downloaded_file");
    let download_dir = app
        .path()
        .download_dir()
        .map_err(|e| format!("Could not find Downloads folder: {}", e))?;
    let dest_path = download_dir.join(file_name);
    tokio::fs::write(&dest_path, bytes)
        .await
        .map_err(|e| format!("Failed to save file: {}", e))?;
    Ok(dest_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(AppState {
            watchers: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            list_files,
            create_folder,
            delete_object,
            get_share_url,
            upload_file,
            download_file,
            get_all_sync_configs,
            save_sync_config,
            get_storage_usage,
            set_filelu_credentials,
            get_filelu_credentials_status,
            clear_filelu_credentials,
            start_sync_for_user,
            stop_sync_for_user
        ])
        .setup(|_app| {
            log("UMS backend ready");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}