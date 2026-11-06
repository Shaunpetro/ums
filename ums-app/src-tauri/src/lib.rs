// Path: ums-app/src-tauri/src/lib.rs
// Purpose: Tauri backend with 1-hour background sync queue, tray menu, keyring credentials, and caching.

use aws_config::BehaviorVersion;
use aws_sdk_s3::config::{
    Credentials, Region, RequestChecksumCalculation, ResponseChecksumValidation,
};
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client;
use base64::{engine::general_purpose, Engine as _};
use chrono::Local;
use keyring::Entry;
use notify::{EventKind, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager, State, WindowEvent};
use tauri_plugin_notification::NotificationExt;
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
    keyring_entry(name)?.get_password().map_err(|e| format!("Keyring get '{}' failed: {}", name, e))
}

fn set_credential(name: &str, value: &str) -> Result<(), String> {
    keyring_entry(name)?.set_password(value).map_err(|e| format!("Keyring set '{}' failed: {}", name, e))
}

fn delete_credential(name: &str) {
    if let Ok(entry) = keyring_entry(name) {
        let _ = entry.delete_credential();
    }
}

fn get_credential_or_env(keyring_name: &str, env_name: &str) -> Result<String, String> {
    if let Ok(v) = get_credential(keyring_name) {
        if !v.is_empty() { return Ok(v); }
    }
    std::env::var(env_name).map_err(|_| format!("Missing credential '{}'", keyring_name))
}

fn format_s3_error<E: std::fmt::Debug>(e: E) -> String {
    let err_str = format!("{:?}", e);
    if err_str.contains("Free plan daily request limit exceeded") {
        "Daily API limit exceeded. Please wait 24 hours.".to_string()
    } else if err_str.contains("AccessDenied") {
        "Access denied. Please check your FileLu credentials.".to_string()
    } else if err_str.contains("dispatch failure") || err_str.contains("connect") {
        "Network error. Please check your internet connection.".to_string()
    } else {
        "Unexpected cloud error. Please check logs.".to_string()
    }
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
    pub pending_uploads: Mutex<HashMap<String, (PathBuf, Instant)>>,
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
    let endpoint = get_credential_or_env(KEYRING_ENDPOINT, "FILELU_ENDPOINT").unwrap_or_else(|_| "https://eu.s5lu.com".to_string());
    let bucket = get_credential_or_env(KEYRING_BUCKET, "FILELU_BUCKET").unwrap_or_else(|_| "ums-prod".to_string());

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
async fn set_filelu_credentials(access_key: String, secret_key: String, endpoint: String, bucket: String) -> Result<(), String> {
    let current_access = get_credential(KEYRING_ACCESS).unwrap_or_default();
    let current_secret = get_credential(KEYRING_SECRET).unwrap_or_default();
    let new_access = if access_key.trim().is_empty() { current_access } else { access_key.trim().to_string() };
    let new_secret = if secret_key.trim().is_empty() { current_secret } else { secret_key.trim().to_string() };

    if new_access.is_empty() || new_secret.is_empty() {
        return Err("Access key and secret key are required for initial setup.".to_string());
    }

    set_credential(KEYRING_ACCESS, &new_access)?;
    set_credential(KEYRING_SECRET, &new_secret)?;
    if !endpoint.trim().is_empty() { set_credential(KEYRING_ENDPOINT, endpoint.trim())?; }
    if !bucket.trim().is_empty() { set_credential(KEYRING_BUCKET, bucket.trim())?; }
    log("FileLu credentials updated in keyring");
    Ok(())
}

#[tauri::command]
async fn get_filelu_credentials_status() -> Result<CredentialStatus, String> {
    let has = |name: &str| -> bool { get_credential(name).map(|v| !v.is_empty()).unwrap_or(false) };
    let access_key_set = has(KEYRING_ACCESS);
    let secret_key_set = has(KEYRING_SECRET);
    Ok(CredentialStatus {
        access_key_set, secret_key_set,
        endpoint_set: has(KEYRING_ENDPOINT), bucket_set: has(KEYRING_BUCKET),
        all_set: access_key_set && secret_key_set,
    })
}

#[tauri::command]
async fn clear_filelu_credentials() -> Result<(), String> {
    delete_credential(KEYRING_ACCESS);
    delete_credential(KEYRING_SECRET);
    delete_credential(KEYRING_ENDPOINT);
    delete_credential(KEYRING_BUCKET);
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
        if let Ok(configs) = serde_json::from_str::<Vec<SyncConfig>>(&content) { return configs; }
    }
    vec![]
}

fn write_all_sync_configs(app: &tauri::AppHandle, configs: &[SyncConfig]) -> Result<(), String> {
    let path = get_config_path(app);
    if let Some(parent) = path.parent() { std::fs::create_dir_all(parent).map_err(|e| e.to_string())?; }
    let json = serde_json::to_string_pretty(configs).map_err(|e| e.to_string())?;
    std::fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

fn stop_watcher_for_prefix(state: &State<'_, AppState>, prefix: &str) {
    let mut guard = state.watchers.lock().unwrap();
    if guard.remove(prefix).is_some() { log(&format!("Stopped watcher for prefix: {}", prefix)); }
}

#[tauri::command]
async fn save_sync_config(app: tauri::AppHandle, state: State<'_, AppState>, local_path: String, sync_target_prefix: String) -> Result<(), String> {
    let safe_target = sanitize_prefix(&sync_target_prefix);
    let mut configs = get_all_sync_configs(app.clone());
    configs.retain(|c| c.sync_target_prefix != safe_target);
    configs.push(SyncConfig { local_path: local_path.clone(), sync_target_prefix: safe_target.clone(), enabled: true });
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
async fn start_sync_for_user(app: tauri::AppHandle, state: State<'_, AppState>, user_path: String) -> Result<bool, String> {
    let safe_target = sanitize_prefix(&user_path);
    let configs = get_all_sync_configs(app.clone());
    let config = match configs.into_iter().find(|c| c.sync_target_prefix == safe_target && c.enabled) {
        Some(c) => c, None => return Ok(false),
    };

    if !Path::new(&config.local_path).exists() {
        log(&format!("Local sync folder missing: {}", config.local_path));
        return Ok(false);
    }

    { let guard = state.watchers.lock().unwrap(); if guard.contains_key(&safe_target) { return Ok(true); } }

    start_watcher(app.clone(), state, config.local_path.clone(), safe_target.clone())?;
    let app_clone = app.clone();
    let local_path = config.local_path.clone();
    tauri::async_runtime::spawn(async move {
        let _ = perform_initial_sync(app_clone, local_path, safe_target).await;
    });
    Ok(true)
}

#[tauri::command]
async fn stop_sync_for_user(state: State<'_, AppState>, user_path: String) -> Result<(), String> {
    let safe_target = sanitize_prefix(&user_path);
    stop_watcher_for_prefix(&state, &safe_target);
    Ok(())
}

// --- OPENER ---

#[tauri::command]
fn open_local_folder(path: String) -> Result<(), String> {
    tauri_plugin_opener::open_path(&path, None::<&str>).map_err(|e| format!("Failed to open folder: {}", e))
}

// --- WATCHER ---

fn start_watcher(app: tauri::AppHandle, state: State<'_, AppState>, path_str: String, target_prefix: String) -> Result<(), String> {
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<notify::Event>();

    let mut watcher = notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
        if let Ok(event) = res {
            if matches!(event.kind, EventKind::Create(_) | EventKind::Modify(_)) {
                let _ = tx.send(event);
            }
        }
    }).map_err(|e| e.to_string())?;

    watcher.watch(Path::new(&path_str), RecursiveMode::Recursive).map_err(|e| format!("Failed to watch folder: {}", e))?;
    { let mut guard = state.watchers.lock().unwrap(); guard.insert(target_prefix.clone(), watcher); }

    let app_handle = app.clone();
    let base_path = PathBuf::from(&path_str);
    let target_prefix_clone = target_prefix.clone();

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            for path in event.paths {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with("~$") || name.ends_with(".tmp") || name == ".DS_Store" { continue; }
                }
                
                if let Ok(rel_path) = path.strip_prefix(&base_path) {
                    let rel_str = rel_path.to_string_lossy().replace("\\", "/");
                    let full_s3_key = format!("{}{}", target_prefix_clone, rel_str);

                    if path.is_dir() {
                        let key = format!("{}/", full_s3_key);
                        if let Ok((client, bucket)) = get_s3_client().await {
                            let _ = client.put_object().bucket(bucket).key(&key).body(ByteStream::from_static(b"")).send().await;
                        }
                    } else if path.is_file() {
                        let state = app_handle.state::<AppState>();
                        {
                            let mut guard = state.pending_uploads.lock().unwrap();
                            guard.insert(full_s3_key, (path.clone(), Instant::now()));
                        }
                        let _ = app_handle.emit("sync-status", serde_json::json!({ "status": "pending", "message": format!("File queued for sync.") }));
                    }
                }
            }
        }
    });

    log(&format!("Started watching: {} -> {}", path_str, target_prefix));
    Ok(())
}

async fn upload_local_file(app: tauri::AppHandle, local_file_path: String, s3_key: String) -> Result<(), String> {
    let result = async {
        let (client, bucket) = get_s3_client().await?;
        let body = ByteStream::from_path(&local_file_path).await.map_err(|e| format!("Open error: {}", e))?;
        client.put_object().bucket(bucket).key(&s3_key).body(body).content_type("application/octet-stream").send().await.map_err(format_s3_error)?;
        Ok::<(), String>(())
    }.await;

    match result {
        Ok(_) => { log(&format!("Upload complete: {}", s3_key)); let _ = app.emit("upload-success", s3_key); Ok(()) }
        Err(e) => { log(&format!("Upload error: {}", e)); let _ = app.emit("upload-error", e.clone()); Err(e) }
    }
}

async fn perform_initial_sync(app: tauri::AppHandle, local_path: String, target_prefix: String) -> Result<(), String> {
    log(&format!("Starting initial directory sync for {}", target_prefix));
    let base_path = PathBuf::from(&local_path);

    for entry in WalkDir::new(&base_path).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if name.starts_with("~$") || name.ends_with(".tmp") || name == ".DS_Store" { continue; }
        }
        if let Ok(rel_path) = path.strip_prefix(&base_path) {
            let rel_str = rel_path.to_string_lossy().replace("\\", "/");
            let full_s3_key = format!("{}{}", target_prefix, rel_str);
            if path.is_dir() {
                let key = format!("{}/", full_s3_key);
                if let Ok((client, bucket)) = get_s3_client().await {
                    let _ = client.put_object().bucket(bucket).key(&key).body(ByteStream::from_static(b"")).send().await;
                }
            } else if path.is_file() {
                let _ = upload_local_file(app.clone(), path.to_string_lossy().to_string(), full_s3_key).await;
            }
        }
    }
    log("Initial sync finished.");
    Ok(())
}

// --- BATCH SYNC LOGIC ---

#[tauri::command]
async fn flush_pending_uploads(app: tauri::AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let files_to_upload: Vec<(String, PathBuf)> = {
        let mut guard = state.pending_uploads.lock().unwrap();
        guard.drain().map(|(k, (p, _))| (k, p)).collect()
    };

    if files_to_upload.is_empty() {
        return Ok(());
    }

    let count = files_to_upload.len();
    let _ = app.emit("sync-status", serde_json::json!({ "status": "flushing", "message": format!("Syncing {} files to cloud...", count) }));

    for (rel_key, path) in files_to_upload {
        let _ = upload_local_file(app.clone(), path.to_string_lossy().to_string(), rel_key).await;
    }

    let _ = app.emit("sync-status", serde_json::json!({ "status": "success", "message": format!("Background sync complete. Uploaded {} files.", count) }));
    Ok(())
}

// --- FILE PREVIEW & CACHE ---

#[tauri::command]
async fn read_local_file_as_base64(local_root: String, s3_key: String, user_path: String) -> Result<String, String> {
    let safe_user_path = sanitize_prefix(&user_path);
    let relative_path = s3_key.strip_prefix(&safe_user_path).unwrap_or(&s3_key);
    let full_path = PathBuf::from(&local_root).join(relative_path);
    
    if !full_path.exists() {
        return Err("File not found locally".to_string());
    }

    let bytes = tokio::fs::read(&full_path).await.map_err(|e| format!("Failed to read local file: {}", e))?;
    Ok(general_purpose::STANDARD.encode(&bytes))
}

fn cache_dir(app: &tauri::AppHandle) -> PathBuf {
    let mut path = app.path().app_config_dir().unwrap_or_else(|_| PathBuf::from("."));
    path.push("file_cache");
    let _ = std::fs::create_dir_all(&path);
    path
}

fn cache_key(s3_key: &str) -> String {
    let mut hasher = DefaultHasher::new();
    s3_key.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

#[derive(Serialize, Deserialize)]
struct CacheMeta {
    s3_key: String,
    last_modified: String,
    cached_at: i64,
    size: u64,
}

fn get_cache_paths(app: &tauri::AppHandle, s3_key: &str) -> (PathBuf, PathBuf) {
    let dir = cache_dir(app);
    let key_hash = cache_key(s3_key);
    let ext = Path::new(s3_key).extension().and_then(|e| e.to_str()).unwrap_or("bin");
    let cache_file = dir.join(format!("{}.{}", key_hash, ext));
    let meta_file = dir.join(format!("{}.meta.json", key_hash));
    (cache_file, meta_file)
}

#[tauri::command]
async fn cache_file_from_cloud(app: tauri::AppHandle, s3_key: String, last_modified: String, force_refresh: bool) -> Result<String, String> {
    let (cache_file, meta_file) = get_cache_paths(&app, &s3_key);
    let now = Local::now().timestamp();

    if !force_refresh && cache_file.exists() && meta_file.exists() {
        if let Ok(meta_str) = std::fs::read_to_string(&meta_file) {
            if let Ok(meta) = serde_json::from_str::<CacheMeta>(&meta_str) {
                if meta.last_modified == last_modified {
                    let bytes = std::fs::read(&cache_file).map_err(|e| e.to_string())?;
                    log(&format!("Cache HIT for {} (v: {})", s3_key, last_modified));
                    return Ok(general_purpose::STANDARD.encode(&bytes));
                }
            }
        }
    }

    log(&format!("Cache MISS for {}. Downloading from cloud...", s3_key));
    let (client, bucket) = get_s3_client().await?;
    let resp = client.get_object().bucket(bucket).key(&s3_key).send().await.map_err(format_s3_error)?;
    let bytes = resp.body.collect().await.map_err(|e| format!("Read error: {}", e))?.into_bytes();
    let size = bytes.len() as u64;

    let _ = std::fs::write(&cache_file, &bytes);
    let meta = CacheMeta { s3_key: s3_key.clone(), last_modified: last_modified.clone(), cached_at: now, size };
    if let Ok(json) = serde_json::to_string(&meta) {
        let _ = std::fs::write(&meta_file, json);
    }

    let _ = evict_cache_if_needed(&cache_dir(&app), 500 * 1024 * 1024);
    Ok(general_purpose::STANDARD.encode(&bytes))
}

#[tauri::command]
async fn open_file_natively(app: tauri::AppHandle, s3_key: String, local_root: Option<String>, user_path: String, last_modified: String) -> Result<(), String> {
    if let Some(root) = local_root {
        let safe_user_path = sanitize_prefix(&user_path);
        let relative_path = s3_key.strip_prefix(&safe_user_path).unwrap_or(&s3_key);
        let full_path = PathBuf::from(&root).join(relative_path);
        
        if full_path.exists() {
            log(&format!("Opening locally: {:?}", full_path));
            return tauri_plugin_opener::open_path(full_path, None::<&str>).map_err(|e| e.to_string());
        }
    }

    let (cache_file, meta_file) = get_cache_paths(&app, &s3_key);
    let now = Local::now().timestamp();
    
    if cache_file.exists() && meta_file.exists() {
        if let Ok(meta_str) = std::fs::read_to_string(&meta_file) {
            if let Ok(meta) = serde_json::from_str::<CacheMeta>(&meta_str) {
                if meta.last_modified == last_modified {
                    log(&format!("Opening from CACHE: {:?}", cache_file));
                    return tauri_plugin_opener::open_path(cache_file, None::<&str>).map_err(|e| e.to_string());
                }
            }
        }
    }

    log(&format!("Downloading for native open: {}", s3_key));
    let (client, bucket) = get_s3_client().await?;
    let resp = client.get_object().bucket(bucket).key(&s3_key).send().await.map_err(format_s3_error)?;
    let bytes = resp.body.collect().await.map_err(|e| e.to_string())?.into_bytes();
    let size = bytes.len() as u64;

    let _ = std::fs::write(&cache_file, &bytes);
    let meta = CacheMeta { s3_key: s3_key.clone(), last_modified, cached_at: now, size };
    if let Ok(json) = serde_json::to_string(&meta) {
        let _ = std::fs::write(&meta_file, json);
    }
    let _ = evict_cache_if_needed(&cache_dir(&app), 500 * 1024 * 1024);

    tauri_plugin_opener::open_path(cache_file, None::<&str>).map_err(|e| e.to_string())
}

fn evict_cache_if_needed(dir: &PathBuf, max_bytes: u64) -> std::io::Result<()> {
    let mut entries: Vec<(PathBuf, u64, i64)> = Vec::new();
    let mut total: u64 = 0;

    if let Ok(rd) = std::fs::read_dir(dir) {
        for entry in rd.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("json") { continue; }
            
            if let Ok(meta) = entry.metadata() {
                let cached_at = meta.modified().ok().and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok()).map(|d| d.as_secs() as i64).unwrap_or(0);
                total += meta.len();
                entries.push((path, meta.len(), cached_at));
            }
        }
    }

    if total <= max_bytes { return Ok(()); }

    entries.sort_by_key(|(_, _, t)| *t);
    for (path, size, _) in entries {
        if total <= max_bytes { break; }
        let _ = std::fs::remove_file(&path);
        let meta_path = path.with_extension("meta.json");
        let _ = std::fs::remove_file(&meta_path);
        total = total.saturating_sub(size);
    }
    Ok(())
}

#[tauri::command]
fn clear_file_cache(app: tauri::AppHandle) -> Result<(), String> {
    let dir = cache_dir(&app);
    if let Ok(rd) = std::fs::read_dir(&dir) {
        for entry in rd.flatten() {
            let _ = std::fs::remove_file(entry.path());
        }
    }
    Ok(())
}

// --- LOCAL LISTING ---

#[tauri::command]
fn list_local_files(local_root: String, current_prefix: String, user_path: String) -> Result<Vec<S3Object>, String> {
    let base = PathBuf::from(&local_root);
    let user_base = sanitize_prefix(&user_path);
    
    let rel_prefix = current_prefix.strip_prefix(&user_base).unwrap_or("").trim_start_matches('/');
    let search_dir = base.join(rel_prefix);
    
    if !search_dir.exists() { return Ok(vec![]); }

    let mut objects = Vec::new();
    let entries = std::fs::read_dir(&search_dir).map_err(|e| format!("Local read error: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();
        if name.starts_with('~') || name == ".DS_Store" { continue; }

        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let is_folder = metadata.is_dir();
        let key = format!("{}{}{}", current_prefix, name, if is_folder { "/" } else { "" });
        
        let last_modified = metadata.modified().ok().map(|t| {
            let dt: chrono::DateTime<chrono::Utc> = t.into();
            dt.to_rfc3339()
        });

        objects.push(S3Object {
            key, size: if is_folder { 0 } else { metadata.len() }, is_folder, last_modified,
        });
    }
    Ok(objects)
}

// --- IT SUPPORT (PING IT) ---

#[tauri::command]
async fn send_it_alert(user_name: String, user_org: String, user_dept: String, issue: String) -> Result<(), String> {
    let (client, bucket) = get_s3_client().await?;
    let now = Local::now();
    let file_timestamp = now.format("%Y-%m-%d_%H-%M-%S").to_string();
    let human_timestamp = now.format("%Y-%m-%d %H:%M:%S").to_string();
    let key = format!("{}/it_alerts/{}_{}.json", user_org, file_timestamp, user_name.replace(" ", "_"));

    let payload = serde_json::json!({
        "user_name": user_name, "user_org": user_org, "user_dept": user_dept, "issue": issue, "timestamp": human_timestamp, "status": "open"
    });

    let body = ByteStream::from(serde_json::to_vec(&payload).map_err(|e| e.to_string())?);
    client.put_object().bucket(bucket).key(&key).body(body).content_type("application/json").send().await.map_err(format_s3_error)?;
    log(&format!("IT Alert saved to S3: {}", key));
    Ok(())
}

async fn poll_it_alerts(app: tauri::AppHandle) {
    let mut last_seen_key = String::new();
    tokio::time::sleep(Duration::from_secs(10)).await;

    loop {
        if let Ok((client, bucket)) = get_s3_client().await {
            if let Ok(resp) = client.list_objects_v2().bucket(&bucket).prefix("VSC Mining/it_alerts/").send().await {
                if let Some(contents) = resp.contents {
                    if last_seen_key.is_empty() {
                        if let Some(newest) = contents.last() { if let Some(k) = &newest.key { last_seen_key = k.clone(); } }
                    } else {
                        for obj in contents {
                            if let Some(key) = &obj.key {
                                if key > &last_seen_key && key.ends_with(".json") {
                                    let msg = format!("New IT Alert from {}", key.split('_').last().unwrap_or("User").replace(".json", ""));
                                    let _ = app.notification().builder().title("Ubuveil IT Support").body(&msg).show();
                                    last_seen_key = key.clone();
                                }
                            }
                        }
                    }
                }
            }
        }
        tokio::time::sleep(Duration::from_secs(3600)).await;
    }
}

// --- STORAGE USAGE & LISTING ---

#[tauri::command]
async fn get_storage_usage() -> Result<u64, String> {
    let (client, bucket) = get_s3_client().await?;
    let mut total_size = 0u64;
    let mut continuation_token: Option<String> = None;

    loop {
        let mut req = client.list_objects_v2().bucket(&bucket);
        if let Some(token) = &continuation_token { req = req.continuation_token(token); }
        let resp = req.send().await.map_err(format_s3_error)?;

        if let Some(contents) = resp.contents {
            for obj in contents { total_size += obj.size.unwrap_or(0) as u64; }
        }
        if resp.is_truncated == Some(true) { continuation_token = resp.next_continuation_token; } else { break; }
    }
    Ok(total_size)
}

#[tauri::command]
async fn list_files(prefix: Option<String>) -> Result<Vec<S3Object>, String> {
    let raw_prefix = prefix.unwrap_or_else(|| "".to_string());
    let search_prefix = sanitize_prefix(&raw_prefix);
    let (client, bucket) = get_s3_client().await?;
    let resp = client.list_objects_v2().bucket(bucket).prefix(&search_prefix).delimiter("/").send().await.map_err(format_s3_error)?;
    
    let mut objects = Vec::new();
    if let Some(prefixes) = resp.common_prefixes {
        for p in prefixes {
            if let Some(p_prefix) = p.prefix {
                let display_name = p_prefix.strip_prefix(&search_prefix).unwrap_or(&p_prefix).to_string();
                if !display_name.is_empty() { objects.push(S3Object { key: p_prefix, size: 0, is_folder: true, last_modified: None }); }
            }
        }
    }
    if let Some(contents) = resp.contents {
        for object in contents {
            let last_mod = object.last_modified().map(|dt| dt.to_string());
            let size = object.size.unwrap_or(0) as u64;
            if let Some(key) = object.key {
                if key == search_prefix { continue; }
                let normalized_key = key.trim_end_matches('/');
                let has_extension = normalized_key.split('/').last().unwrap_or("").contains('.');
                let is_folder = key.ends_with('/') || (size == 0 && !has_extension);
                if is_folder {
                    let exists = objects.iter().any(|o| o.key.trim_end_matches('/') == normalized_key);
                    if exists { continue; }
                    objects.push(S3Object { key: format!("{}/", normalized_key), size: 0, is_folder: true, last_modified: last_mod });
                } else {
                    objects.push(S3Object { key, size, is_folder: false, last_modified: last_mod });
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
    client.put_object().bucket(bucket).key(&key).body(ByteStream::from_static(b"")).send().await.map_err(format_s3_error)?;
    Ok(())
}

#[tauri::command]
async fn delete_object(key: String) -> Result<(), String> {
    let (client, bucket) = get_s3_client().await?;
    client.delete_object().bucket(bucket).key(&key).send().await.map_err(format_s3_error)?;
    Ok(())
}

#[tauri::command]
async fn get_share_url(key: String) -> Result<String, String> {
    let (client, bucket) = get_s3_client().await?;
    let presigning_config = aws_sdk_s3::presigning::PresigningConfig::builder().expires_in(Duration::from_secs(3600)).build().map_err(|e| format!("Failed to build presigning config: {}", e))?;
    let presigned_req = client.get_object().bucket(bucket).key(key).presigned(presigning_config).await.map_err(|e| format!("Failed to generate URL: {:?}", e))?;
    Ok(presigned_req.uri().to_string())
}

#[tauri::command]
async fn upload_file(app: tauri::AppHandle, file_path: String, current_prefix: String) -> Result<(), String> {
    let safe_prefix = sanitize_prefix(&current_prefix);
    let file_name = Path::new(&file_path).file_name().and_then(|n| n.to_str()).ok_or("Invalid file name")?.to_string();
    let key = format!("{}{}", safe_prefix, file_name);
    tauri::async_runtime::spawn(async move { let _ = upload_local_file(app, file_path, key).await; });
    Ok(())
}

#[tauri::command]
async fn download_file(app: tauri::AppHandle, key: String) -> Result<String, String> {
    let (client, bucket) = get_s3_client().await?;
    let resp = client.get_object().bucket(bucket).key(&key).send().await.map_err(format_s3_error)?;
    let bytes = resp.body.collect().await.map_err(|e| format!("Failed to read body: {}", e))?.into_bytes();
    let file_name = key.split('/').last().unwrap_or("downloaded_file");
    let download_dir = app.path().download_dir().map_err(|e| format!("Could not find Downloads folder: {}", e))?;
    let dest_path = download_dir.join(file_name);
    tokio::fs::write(&dest_path, bytes).await.map_err(|e| format!("Failed to save file: {}", e))?;
    Ok(dest_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .manage(AppState {
            watchers: Mutex::new(HashMap::new()),
            pending_uploads: Mutex::new(HashMap::new()),
        })
        .invoke_handler(tauri::generate_handler![
            list_files, list_local_files, create_folder, delete_object, get_share_url, read_local_file_as_base64,
            cache_file_from_cloud, open_file_natively, clear_file_cache, upload_file, download_file, get_all_sync_configs,
            save_sync_config, get_storage_usage, set_filelu_credentials, get_filelu_credentials_status,
            clear_filelu_credentials, start_sync_for_user, stop_sync_for_user, send_it_alert, open_local_folder,
            flush_pending_uploads
        ])
        .setup(|app| {
            log("UMS backend ready");
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Open Ubuveil MS", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => app.exit(0),
                    "show" => { if let Some(window) = app.get_webview_window("main") { let _ = window.show(); let _ = window.set_focus(); } }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") { let _ = window.show(); let _ = window.set_focus(); }
                    }
                }).build(app)?;

            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move { 
                poll_it_alerts(handle.clone()).await; 
            });

            // 1-Hour Background Flush Loop
            let flush_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(Duration::from_secs(60)).await;
                    let state = flush_handle.state::<AppState>();
                    let mut to_flush = Vec::new();
                    {
                        let mut guard = state.pending_uploads.lock().unwrap();
                        let now = Instant::now();
                        let mut keys_to_remove = Vec::new();
                        for (k, (path, time)) in guard.iter() {
                            if now.duration_since(*time) >= Duration::from_secs(3600) {
                                to_flush.push((k.clone(), path.clone()));
                                keys_to_remove.push(k.clone());
                            }
                        }
                        for k in keys_to_remove {
                            guard.remove(&k);
                        }
                    }
                    if !to_flush.is_empty() {
                        let _ = flush_handle.emit("sync-status", serde_json::json!({ "status": "flushing", "message": format!("Syncing {} files...", to_flush.len()) }));
                        for (k, path) in to_flush {
                            let _ = upload_local_file(flush_handle.clone(), path.to_string_lossy().to_string(), k).await;
                        }
                        let _ = flush_handle.emit("sync-status", serde_json::json!({ "status": "success", "message": "Background sync complete." }));
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event { window.hide().unwrap(); api.prevent_close(); }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}