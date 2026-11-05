# UMS - Stage 03 Handover

**Stage:** 03
**Slug:** branding-tray-it-support
**Date:** 2026-11-05
**Author:** Petro Malamule (Petro@ATG)
**Git branch:** `stage/02-installer-updates`
**Rules version active:** 2.0
**Supersedes:** `01-stage-01-ui-shell.md` (for active development)

---

## 1. Stage Metadata

- **Project:** Ubuveil Management System (UMS)
- **Developer:** Petro Malamule
- **GitHub:** shaunpetro
- **Root folder:** `E:\Creative Cloud\Design\2026\atg\Dev\Ubuveil UMS`
- **Target platform (Phase 1):** Windows 10/11 only
- **Stack:** Tauri v2 (Rust) + React 18 (TypeScript) + Vite

---

## 2. Prior Handover Reference

- **Previous:** `02-stage-02-installer-updates.md` (established CI/CD, NSIS, and auto-updater).

---

## 3. Where the Project Started

At the end of Stage 02, the app successfully built, signed, and auto-updated via GitHub Releases. However, it used default Tauri icons, crashed if FileLu API limits were hit, lacked a system tray (closing the window killed the background watcher), and had no way for users to report issues to IT.

---

## 4. Where the Project Is Now

The app is now a professional, branded desktop application. It features a system tray that keeps background sync alive (OneDrive-style), runs on boot, displays a personalized footer, and allows users to "Ping IT" via S3 JSON drops. 

Crucially, we implemented a **Local-First File Cache and Viewer**. Users can open PDFs, images, and text files natively without consuming API quota if the file is already on their PC or in the cache. If the FileLu API limit is hit, the app gracefully falls back to an "Offline Mode" that reads directly from the local sync folder, ensuring zero downtime for the user.

---

## 5. What Was Done This Stage

- `S03-T01`: Generated official App Icons (`.ico`, `.icns`, `.png`) from `assets/source/app/icon.svg`.
- `S03-T02`: Updated `tauri.conf.json` to show "Ubuveil Management System" in Windows Settings, with "ATG (Pty) Ltd" as Publisher.
- `S03-T03`: Implemented System Tray in `lib.rs`. Closing the window now hides it to the tray instead of quitting.
- `S03-T04`: Added IT Support Skeleton. Users can submit a ping from the `HelpModal.tsx`. Rust writes this to S3 (`VSC Mining/it_alerts/`) and fires a native Windows toast to the admin.
- `S03-T05`: Replaced native `alert()` popups with a custom `ToastContext.tsx` for glassmorphism-styled notifications. Errors persist until manually closed.
- `S03-T06`: Built a full-screen `FileViewerModal.tsx` that renders PDFs, Images, and Text directly in the app.
- `S03-T07`: Implemented a `file_cache` in `%APPDATA%`. When viewing files from other users, the app caches them locally (500MB LRU limit) with strict `last_modified` timestamp validation. 
- `S03-T08`: Built `open_file_natively` in Rust. It checks local disk, then cache, then cloud. Opening a Word doc you own uses 0 API calls.
- `S03-T09`: Mitigated API limits by throttling background pollers to 1 hour and adding `list_local_files` fallback if S3 fails.
- `S03-T10`: Updated `.github/workflows/release.yml` to use `gh release download` to reliably push `latest.json` to the `updates` branch for the auto-updater.

---

## 6. Known Bugs Not Fixed

- **Bidirectional Sync:** The app currently only uploads local changes. Changes made by other users to the S3 bucket do not automatically download to the local sync folder. The cache handles viewing, but the files do not permanently live on the disk unless manually downloaded. (Deferred to Phase 2).
- **FileLu API Throttling:** Heavy browsing of files *not* in your local folder or cache can still hit the 1000/day limit. The app handles this gracefully by falling back to local file listings and showing an error banner.

---

## 7. Current Workings

- **Open branches:** `stage/02-installer-updates`.
- **Uncommitted changes:** All code is saved and ready for `v0.1.8` tag.
- **Pending decisions:** The Autentico local server setup is paused until the UI/UX and FileLu sync are completely battle-tested.

---

## 8. Next Steps

1. `S03-N01`: Commit Stage 03 code and docs.
2. `S03-N02`: Tag `app-v0.1.8` and push to GitHub.
3. `S03-N03`: Verify CI build and test the auto-update flow from `0.1.7` to `0.1.8`.
4. `S03-N04`: Deploy to the 3 primary PCs.

---

## 9. Decision Log

- **DEC-044:** Hybrid "Ping IT" Support System.
- **DEC-045:** System Tray & Background Sync.
- **DEC-046:** Windows Installer Identity.
- **DEC-047:** FileLu API Polling Limits (1 hour).
- **DEC-048:** Local On-Premise Auth & Staged Revocation.
- **DEC-049:** File Viewer & Metadata Cache.
- **DEC-050:** FileLu API Rate Limit Mitigation.
- **DEC-051:** Local-First Native Opening.

---

## 10. Dependency Inventory

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| tauri-plugin-notification | 2.x | Native Windows toasts for IT alerts |
| tauri-plugin-autostart | 2.x | Launch UMS on Windows boot |
| base64 | 0.22 | Encoding file bytes for the React viewer |
| lucide-react | latest | Icons for the UI |

---

## 11. Rollback Contract

To rollback this stage, run:
`git reset --hard 1d0cc0d`
This reverts the codebase to the end of Stage 02 (before branding, tray, and IT support).

---

## 12. Fail-Safe Alignment

| Path | First line (SIG-1) | Approx lines |
| :--- | :--- | :--- |
| `ums-app/src-tauri/src/lib.rs` | `// Path: ums-app/src-tauri/src/lib.rs` | 845 |
| `ums-app/src/components/Layout/AppShell.tsx` | `// Path: ums-app/src/components/Layout/AppShell.tsx` | 245 |
| `ums-app/src/components/Layout/FileViewerModal.tsx` | `// Path: ums-app/src/components/Layout/FileViewerModal.tsx` | 208 |
| `ums-app/src/pages/Storage.tsx` | `// Path: ums-app/src/pages/Storage.tsx` | 435 |
| `.github/workflows/release.yml` | `# Path: .github/workflows/release.yml` | 75 |