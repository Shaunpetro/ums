// Path: ums-app/src-tauri/src/main.rs
// Purpose: Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ums_app_lib::run()
}
