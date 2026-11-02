# UMS - Stage 01 UI Shell Handover

**Stage:** 01
**Slug:** ui-shell-and-storage
**Date:** 2026-11-02
**Author:** Petro Malamule (Petro@ATG)
**Git branch:** `stage/01-ui-shell`
**Rules version active:** 2.0
**Supersedes:** `00-founding.md` (for active development)

---

## 1. Stage Metadata

- **Project:** Ubuveil Management System (UMS)
- **Developer:** Petro Malamule
- **GitHub:** shaunpetro
- **Root folder:** `E:\Creative Cloud\Design\2026\atg\Dev\Ubuveil UMS`
- **Target platform (Phase 1):** Windows 10/11 only
- **Stack:** Tauri v2 (Rust) + React 18 (TypeScript) + Vite + Lucide Icons + React Router

---

## 2. Prior Handover Reference

- **Previous:** `00-founding.md` (establishing the architecture, rules, and asset framework).

---

## 3. Where the Project Started

Stage 00 was dedicated to setting up the documentation, choosing the stack (Tauri + React), fixing the asset pipeline, and starting the Oracle Cloud VPS script for the Autentico authentication server. The UI was non-existent.

---

## 4. Where the Project Is Now

The Tauri desktop application is successfully compiled and running natively. The entire UI shell is built using our warm-dark glassmorphism design tokens. We have fully implemented the routing and the 6 major pipeline views (Dashboard, Storage, Clients, Tenders, Invoices, Projects, Tasks) using mocked data, except for Storage which is fully wired to the FileLu S3 backend.

---

## 5. What Was Done This Stage

- `S01-T01`: Scaffolded the Tauri v2 + React (TypeScript) app inside the `ums-app` folder.
- `S01-T02`: Installed `react-router-dom` for routing and `lucide-react` for icons.
- `S01-T03`: Mapped the design tokens into `src/styles/globals.css` (including custom scrollbars and responsive grids).
- `S01-T04`: Built the `AppShell` layout with the sidebar, topbar, dynamic search placeholders, and theme toggle (with localStorage persistence).
- `S01-T05`: Built all 6 pipeline views with mocked data (Dashboard, Clients, Tenders, Invoices, Projects, Tasks).
- `S01-T06`: Integrated FileLu S3 backend using `aws-sdk-s3` in Rust.
- `S01-T07`: Implemented `upload_file`, `list_files`, `create_folder`, `delete_object`, `get_share_url`, and `download_file`.
- `S01-T08`: Created `UploadContext.tsx` to handle global background uploads. Users can navigate between tabs without cancelling uploads.
- `S01-T09`: Built the right-side Details panel in Storage showing file metadata, dynamic file-type icons/colors, and local download capability.
- `S01-T10`: Fixed multiple S3 quirks (chunked encoding rejection, trailing slash concatenation, duplicate folders).

---

## 6. Known Bugs Not Fixed

- **Share Link Premium Wall:** FileLu's free tier blocks S3 pre-signed URLs. The UI catches the error gracefully and advises the user to download locally instead. This will be superseded by UMS API sharing in a later stage.
- **Oracle VPS:** The `oci compute instance launch` script is still running in the background. Autentico is not yet deployed.

---

## 7. Current Workings

- **Open branches:** `stage/01-ui-shell`.
- **Uncommitted changes:** None (assuming the commit command below is run).
- **Pending decisions:** The exact folder structure for the Local Sync Agent (`E:\UMS_Sync`).

---

## 8. Next Steps

1. `S01-N01`: Implement the Local Folder Watcher using the `notify` Rust crate.
2. `S01-N02`: Create a First-Run setup Modal in React to let users choose their Sync Folder path.
3. `S01-N03`: Configure `tauri-plugin-updater` to pull updates from GitHub Releases.
4. `S01-N04`: Build the production `.msi` installer.
5. `S01-N05`: Install on the 3 primary PCs.

---

## 9. Decision Log

- **DEC-034: Global Upload Context.** React Context is used to hold the upload queue so navigating between tabs does not cancel or hide active uploads.
- **DEC-035: Async Background Uploads.** Rust uses `tokio::spawn` for uploads. React does not freeze during large file transfers.
- **DEC-036: Native Downloads.** Because FileLu blocks presigned URLs on the free tier, `download_file` writes directly to the user's Windows `Downloads` folder via `app.path().download_dir()`.
- **DEC-037: Dynamic File Icons.** File icons are colored based on extension (PDF=Red, Word=Blue, Excel=Green, Images=Purple). Company folders are Gold, Departments are Blue, Standard folders are Gray.

---

## 10. Dependency Inventory

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| Tauri | 2.x | Desktop shell |
| React | 18.x | UI framework |
| React Router DOM | 6.x | Routing |
| Lucide React | 0.x | Icons |
| Vite | 5.x | Frontend build tool |
| AWS SDK for Rust | 1.x | S3 / FileLu connection |
| Tokio | 1.x | Async runtime for uploads |
| Chrono | 0.4 | Timestamp logging |
| tauri-plugin-dialog | 2.x | Native file pickers |
| tauri-plugin-opener | 2.x | (Default Tauri dependency) |

---

## 11. Rollback Contract

To rollback this stage, run:
`git reset --hard 47b4e55` (The last commit before the UI components were added).
This will remove the `ums-app` directory and revert to the documentation-only state.

---

## 12. Fail-Safe Alignment

Files created and modified this stage:

| Path | Purpose |
| :--- | :--- |
| `ums-app/src/App.tsx` | Router setup wrapped in UploadProvider |
| `ums-app/src/main.tsx` | React entry point |
| `ums-app/src/context/UploadContext.tsx` | Global upload state |
| `ums-app/src/components/Layout/AppShell.tsx` | Global layout |
| `ums-app/src/pages/Storage.tsx` | File Manager with S3 integration |
| `ums-app/src/pages/Dashboard.tsx` | Dashboard view |
| `ums-app/src/pages/Clients.tsx` | CRM view |
| `ums-app/src/pages/Tenders.tsx` | Tender Workspace |
| `ums-app/src/pages/Invoices.tsx` | Invoice tracker |
| `ums-app/src/pages/Projects.tsx` | Kanban board |
| `ums-app/src/pages/Tasks.tsx` | Task list + analytics |
| `ums-app/src/styles/globals.css` | Design tokens and shared CSS |
| `ums-app/src-tauri/src/lib.rs` | Rust backend (S3 + async uploads + downloads) |
| `ums-app/src-tauri/Cargo.toml` | Rust dependencies |