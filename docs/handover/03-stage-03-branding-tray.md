# UMS - Stage 03 Handover

**Stage:** 03
**Slug:** branding-tray-it-support
**Date:** 2026-11-06
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

At the end of Stage 02, the app successfully built, signed, and auto-updated via GitHub Releases. However, it used default Tauri icons, crashed if FileLu API limits were hit, lacked a system tray, and had no way for users to report issues to IT.

---

## 4. Where the Project Is Now

Stage 03 is complete. The app is fully branded, runs in the system tray, and features a robust 1-Hour Batch Sync Queue to prevent FileLu API quota exhaustion. Files can be previewed natively (images, PDFs, text) with a local metadata cache to prevent redundant downloads. The auto-updater pipeline is fully automated and confirmed working (jumping from `0.1.4` to `0.1.9`). The GitHub repository was made public to unlock unlimited CI runner minutes, resolving billing locks.

---

## 5. What Was Done This Stage

- `S03-T01`: Generated official App Icons.
- `S03-T02`: Configured Windows Settings display name ("Ubuveil Management System") and Publisher ("ATG (Pty) Ltd") while retaining `ums-app` as the binary name.
- `S03-T03`: Implemented System Tray in `lib.rs`. Closing the window hides it.
- `S03-T04`: Added IT Support Skeleton with native Windows toast notifications for alerts.
- `S03-T05`: Built `ToastContext.tsx` for glassmorphism notifications.
- `S03-T06`: Built `FileViewerModal.tsx` with full-screen PDF/Image/Text rendering.
- `S03-T07`: Implemented 1-Hour Batch Sync Queue. Files trigger a `pending` state and flush every 3600s via background Rust task. Added manual "Sync Now" button.
- `S03-T08`: Implemented `open_file_natively` and Local Cache (`%APPDATA%/file_cache`).
- `S03-T09`: Added persistent Grid/List views, persistent Sort toggle, Name Filter, and Route Persistence.
- `S03-T10`: Fixed `.github/workflows/release.yml` to reliably push `latest.json` to the `updates` branch.

---

## 6. Known Bugs Not Fixed

- **Bidirectional Sync:** The app only uploads local changes. Cloud changes do not automatically download to local folders. (Deferred to Phase 2).
- **Ghost Folders:** Renaming/moving folders locally does not delete the old folder in S3. This is intentional to avoid API quota destruction and data loss during sync.
- **Batch Delay:** Colleagues will not see newly saved files in the cloud until the 1-hour flush occurs (or manual "Sync Now" click).

---

## 7. Current Workings

- **Open branches:** `stage/02-installer-updates`.
- **Uncommitted changes:** None. `v0.1.9` is tagged and released.
- **Pending decisions:** Autentico Local Server (LAN) vs. Cloud.

---

## 8. Next Steps

1. `S03-N01`: Deploy `v0.1.9` to the 3 primary PCs (auto-updates from `0.1.4`).
2. `S03-N02`: Begin Autentico local server setup (Windows PC or Raspberry Pi).
3. `S03-N03`: Move on to building the Tasks pipeline (Kanban/List views).

---

## 9. Decision Log

- **DEC-044 to 048:** (See previous handovers).
- **DEC-049:** File Viewer & Metadata Cache.
- **DEC-050:** FileLu API Rate Limit Mitigation (1-hour batch queue).
- **DEC-051:** Local-First Native Opening.
- **DEC-052:** Persistent UI State (localStorage for sort, view, last route).
- **DEC-053:** Public GitHub Repo for Unlimited CI Minutes.

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