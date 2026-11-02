// Path: ums-app/src-tauri/src/lib.rs
// Purpose: Tauri backend with S3 folder deduplication, async uploads, and downloads.

use aws_config::BehaviorVersion;
use aws_sdk_s3::config::{
    Credentials, Region, RequestChecksumCalculation, ResponseChecksumValidation,
};
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client;
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::time::Duration;
use tauri::{Emitter, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct S3Object {
    pub key: String,
    pub size: u64,
    pub is_folder: bool,
    pub last_modified: Option<String>,
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

    let access_key = std::env::var("FILELU_ACCESS_KEY").map_err(|_| "Missing FILELU_ACCESS_KEY")?;
    let secret_key = std::env::var("FILELU_SECRET_KEY").map_err(|_| "Missing FILELU_SECRET_KEY")?;
    let endpoint = std::env::var("FILELU_ENDPOINT").unwrap_or_else(|_| "https://eu.s5lu.com".to_string());
    let bucket = std::env::var("FILELU_BUCKET").unwrap_or_else(|_| "ums-prod".to_string());

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

#[tauri::command]
async fn list_files(prefix: Option<String>) -> Result<Vec<S3Object>, String> {
    let raw_prefix = prefix.unwrap_or_else(|| "".to_string());
    let search_prefix = sanitize_prefix(&raw_prefix);
    
    log(&format!("Listing files for prefix: '{}'", search_prefix));
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

    // 1. Get folders from CommonPrefixes
    if let Some(prefixes) = resp.common_prefixes {
        for p in prefixes {
            if let Some(p_prefix) = p.prefix {
                let display_name = p_prefix.strip_prefix(&search_prefix).unwrap_or(&p_prefix).to_string();
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

    // 2. Get files (and deduplicate folders) from Contents
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
                    // Check if this folder already exists in our list (ignoring trailing slashes)
                    let exists = objects.iter().any(|o| o.key.trim_end_matches('/') == normalized_key);
                    if exists { continue; }
                    
                    // Force standard folder format
                    let formatted_key = format!("{}/", normalized_key);
                    objects.push(S3Object { key: formatted_key, size: 0, is_folder: true, last_modified: last_mod });
                } else {
                    objects.push(S3Object { key, size, is_folder: false, last_modified: last_mod });
                }
            }
        }
    }

    log(&format!("Found {} items.", objects.len()));
    Ok(objects)
}

#[tauri::command]
async fn create_folder(folder_name: String, current_prefix: String) -> Result<(), String> {
    let safe_prefix = sanitize_prefix(&current_prefix);
    let key = format!("{}{}/", safe_prefix, folder_name);
    log(&format!("Creating folder: {}", key));
    let (client, bucket) = get_s3_client().await?;

    client.put_object().bucket(bucket).key(&key).body(ByteStream::from_static(b"")).send().await
        .map_err(|e| format!("Failed to create folder: {:?}", e))?;

    Ok(())
}

#[tauri::command]
async fn delete_object(key: String) -> Result<(), String> {
    log(&format!("Deleting object: {}", key));
    let (client, bucket) = get_s3_client().await?;

    client.delete_object().bucket(bucket).key(&key).send().await
        .map_err(|e| format!("Failed to delete object: {:?}", e))?;

    Ok(())
}

#[tauri::command]
async fn get_share_url(key: String) -> Result<String, String> {
    log(&format!("Generating share URL for: {}", key));
    let (client, bucket) = get_s3_client().await?;

    let presigning_config = aws_sdk_s3::presigning::PresigningConfig::builder()
        .expires_in(Duration::from_secs(3600))
        .build()
        .map_err(|e| format!("Failed to build presigning config: {}", e))?;

    let presigned_req = client.get_object().bucket(bucket).key(key).presigned(presigning_config).await
        .map_err(|e| format!("Failed to generate URL: {:?}", e))?;

    Ok(presigned_req.uri().to_string())
}

#[tauri::command]
async fn upload_file(app: tauri::AppHandle, file_path: String, current_prefix: String) -> Result<(), String> {
    let safe_prefix = sanitize_prefix(&current_prefix);
    let file_name = Path::new(&file_path).file_name().and_then(|n| n.to_str()).ok_or("Invalid file name")?.to_string();
    let key = format!("{}{}", safe_prefix, file_name);
    
    log(&format!("Starting background upload: {}", key));

    tauri::async_runtime::spawn(async move {
        let result = async {
            let (client, bucket) = get_s3_client().await?;
            let bytes = tokio::fs::read(&file_path).await.map_err(|e| format!("Read error: {}", e))?;
            let body = ByteStream::from(bytes);
            
            client.put_object().bucket(bucket).key(&key).body(body).content_type("application/octet-stream").send().await
                .map_err(|e| format!("Upload failed: {:?}", e))?;
                
            Ok::<(), String>(())
        }.await;

        match result {
            Ok(_) => {
                log(&format!("Upload complete: {}", key));
                let _ = app.emit("upload-success", key);
            }
            Err(e) => {
                log(&format!("Upload error: {}", e));
                let _ = app.emit("upload-error", e);
            }
        }
    });

    Ok(())
}

#[tauri::command]
async fn download_file(app: tauri::AppHandle, key: String) -> Result<String, String> {
    log(&format!("Downloading file: {}", key));
    let (client, bucket) = get_s3_client().await?;

    let resp = client.get_object().bucket(bucket).key(&key).send().await
        .map_err(|e| format!("Download failed: {:?}", e))?;

    let bytes = resp.body.collect().await
        .map_err(|e| format!("Failed to read body: {}", e))?
        .into_bytes();

    let file_name = key.split('/').last().unwrap_or("downloaded_file");
    let download_dir = app.path().download_dir().map_err(|e| format!("Could not find Downloads folder: {}", e))?;
    let dest_path = download_dir.join(file_name);

    tokio::fs::write(&dest_path, bytes).await
        .map_err(|e| format!("Failed to save file: {}", e))?;

    log(&format!("Download complete: {:?}", dest_path));
    Ok(dest_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_files, create_folder, delete_object, get_share_url, upload_file, download_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}