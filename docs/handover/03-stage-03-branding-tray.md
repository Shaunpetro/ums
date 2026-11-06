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

The app is now a professional, branded desktop application. It features a system tray that keeps background sync alive (OneDrive-style), runs on boot, displays a personalized footer, and allows users to "Ping IT".

Crucially, we implemented a **1-Hour Batch Sync Queue** to prevent API quota exhaustion. Files saved locally are queued as "Pending" and flushed to FileLu in batches every hour, on app quit, or via the "Sync Now" button. We also implemented a **Local-First File Cache and Viewer** that allows opening PDFs, images, and Word documents without consuming API quota if they are already on the PC.

---

## 5. What Was Done This Stage

- `S03-T01`: Generated official App Icons (`.ico`, `.icns`, `.png`) from `assets/source/app/icon.svg`.
- `S03-T02`: Updated `tauri.conf.json` to show "Ubuveil Management System" in Windows Settings, with "ATG (Pty) Ltd" as Publisher.
- `S03-T03`: Implemented System Tray in `lib.rs`. Closing the window hides it to the tray.
- `S03-T04`: Added IT Support Skeleton. Users submit pings to S3, and Petro receives a native toast.
- `S03-T05`: Replaced native `alert()` with `ToastContext.tsx`.
- `S03-T06`: Built a full-screen `FileViewerModal.tsx`.
- `S03-T07`: Implemented 1-Hour Batch Sync Queue. Files saved locally trigger a `pending` state, and a background Rust task flushes them every 3600 seconds. Added manual "Sync Now" button in the footer.
- `S03-T08`: Implemented `open_file_natively` and a Local Cache (`%APPDATA%/file_cache`). Opening a Word doc checks local disk -> cache -> cloud.
- `S03-T09`: Added UI controls for Grid/List view, persistent Sort Toggle (A-Z, Z-A, Newest, Oldest), and Filter by name.
- `S03-T10`: Fixed `.github/workflows/release.yml` to correctly push `latest.json` to the `updates` branch using `git push -f`.

---

## 6. Known Bugs Not Fixed

- **Bidirectional Sync:** The app currently only uploads local changes. Changes made by other users to the S3 bucket do not automatically download to the local sync folder.
- **API Latency:** Because files are queued for 1 hour, colleagues will not see a newly saved file in the cloud until the flush occurs. The user can manually click "Sync Now" to expedite this.

---

## 7. Current Workings

- **Open branches:** `stage/02-installer-updates`.
- **Uncommitted changes:** All code is saved, ready to build and tag.
- **Pending decisions:** The Autentico local server setup is paused until the UI/UX and FileLu sync are completely battle-tested.

---

## 8. Next Steps

1. `S03-N01`: Run local smoke test to verify the batch queue, sort toggle, and file viewer.
2. `S03-N02`: Tag `app-v0.1.9` and push to GitHub.
3. `S03-N03`: Verify CI builds and populates the `updates` branch.
4. `S03-N04`: Deploy to the 3 primary PCs.

---

## 9. Decision Log

- **DEC-044 to 048:** (See previous handovers).
- **DEC-049:** File Viewer & Metadata Cache.
- **DEC-050:** FileLu API Rate Limit Mitigation (1-hour batch queue).
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
This reverts the codebase to the end of Stage 02.

---

## 12. Fail-Safe Alignment

| Path | First line (SIG-1) | Approx lines |
| :--- | :--- | :--- |
| `ums-app/src-tauri/src/lib.rs` | `// Path: ums-app/src-tauri/src/lib.rs` | 855 |
| `ums-app/src/components/Layout/AppShell.tsx` | `// Path: ums-app/src/components/Layout/AppShell.tsx` | 275 |
| `ums-app/src/pages/Storage.tsx` | `// Path: ums-app/src/pages/Storage.tsx` | 415 |
| `.github/workflows/release.yml` | `# Path: .github/workflows/release.yml` | 76 |