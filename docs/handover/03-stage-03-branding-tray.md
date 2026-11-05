# UMS - Stage 03 Handover

**Stage:** 03
**Slug:** branding-tray-it-support
**Date:** 2026-11-05
**Author:** Petro Malamule (Petro@ATG)
**Git branch:** `stage/02-installer-updates` (Stage 03 committed on this branch)
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
- **Note:** This stage (03) was executed immediately following Stage 02 due to iterative UX testing and API limit discoveries.

---

## 3. Where the Project Started

At the end of Stage 02, the app successfully built, signed, and auto-updated via GitHub Releases. However, it used default Tauri icons, crashed if FileLu API limits were hit, lacked a system tray (closing the window killed the background watcher), and had no way for users to report issues to IT.

---

## 4. Where the Project Is Now

The app is now a professional, branded desktop application. It features a system tray that keeps background sync alive (OneDrive-style), runs on boot, displays a personalized footer, and allows users to "Ping IT" via S3 JSON drops. The FileLu API limit issue has been mitigated by throttling storage checks to once per hour.

---

## 5. What Was Done This Stage

- `S03-T01`: Generated official App Icons (`.ico`, `.icns`, `.png`) from `assets/source/app/icon.svg`.
- `S03-T02`: Updated `tauri.conf.json` to show "Ubuveil Management System" in Windows Settings, with "ATG (Pty) Ltd" as Publisher, while preserving `ums-app` as the binary name to maintain auto-updater compatibility.
- `S03-T03`: Added `tauri-plugin-notification`, `tauri-plugin-autostart`, and `tauri-plugin-updater` to `Cargo.toml` and registered in `lib.rs`.
- `S03-T04`: Implemented System Tray in `lib.rs`. Closing the window now hides it to the tray instead of quitting. Right-click menu allows full exit.
- `S03-T05`: Added IT Support Skeleton. Users can submit a ping (text) from the `HelpModal.tsx`. Rust writes this to S3 (`VSC Mining/it_alerts/`).
- `S03-T06`: Added a background poller in `lib.rs` that checks the `it_alerts/` prefix every 2 minutes and fires a native Windows toast notification to the IT admin.
- `S03-T07`: Replaced native `alert()` popups with a custom `ToastContext.tsx` for glassmorphism-styled notifications.
- `S03-T08`: Added a persistent Footer (`Ubuveil MS (c) ARR`) and Sidebar status indicators (FileLu connection dot, 1-hour storage polling).
- `S03-T09`: Updated `.github/workflows/release.yml` to include a fast-fail `npx tsc --noEmit` step before the Rust compilation.

---

## 6. Known Bugs Not Fixed

- **FileLu API Throttling:** The free tier limits requests to 1000/day. The app now polls storage usage every 1 hour to prevent hitting this limit, but heavy file activity (uploading 1000 files in a day) could still trigger a temporary lockout. Error is caught gracefully in the UI.
- **Manual Uninstall Required for 0.1.1 -> 0.1.2:** Because `productName` changed to fix Windows Settings, the auto-updater cannot cross-update from 0.1.1 to 0.1.2. Users must manually uninstall 0.1.1 once. Version 0.1.2 onwards will update perfectly via Git tag.

---

## 7. Current Workings

- **Open branches:** `stage/02-installer-updates`.
- **Uncommitted changes:** None (ready to commit and tag).
- **Pending decisions:** The Autentico local server setup is paused until the UI/UX and FileLu sync are completely battle-tested.

---

## 8. Next Steps

1. `S03-N01`: Commit Stage 03 code and docs.
2. `S03-N02`: Tag `app-v0.1.2` and push to GitHub.
3. `S03-N03`: Verify CI build and auto-update flow from 0.1.1 (manual uninstall required for this one transition).
4. `S03-N04`: Deploy to the 3 primary PCs.

---

## 9. Decision Log

- **DEC-044: Hybrid "Ping IT" Support System.** Alerts write to S3 and trigger a native toast notification.
- **DEC-045: System Tray & Background Sync.** App minimizes to tray. Watcher stays alive.
- **DEC-046: Windows Installer Identity.** `productName` is display name, `mainBinaryName` is `ums-app`.
- **DEC-047: FileLu API Polling Limits.** Storage poll reduced to 1 hour to save API quota.
- **DEC-048: Local On-Premise Auth & Staged Revocation.** Autentico hosted on LAN, 30-day JWTs, 3-phase offboarding.

---

## 10. Dependency Inventory

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| tauri-plugin-notification | 2.x | Native Windows toasts for IT alerts |
| tauri-plugin-autostart | 2.x | Launch UMS on Windows boot |
| reqwest | 0.12 | HTTP client (stubbed for future Resend email integration) |
| lucide-react | latest | Icons for the UI |

---

## 11. Rollback Contract

To rollback this stage, run:
`git reset --hard 78e43c2`
This reverts the codebase to the end of Stage 02 (before branding, tray, and IT support).

---

## 12. Fail-Safe Alignment

| Path | First line (SIG-1) | Approx lines |
| :--- | :--- | :--- |
| `ums-app/src-tauri/tauri.conf.json` | `{` | 43 |
| `ums-app/src-tauri/src/lib.rs` | `// Path: ums-app/src-tauri/src/lib.rs` | 765 |
| `ums-app/src/components/Layout/AppShell.tsx` | `// Path: ums-app/src/components/Layout/AppShell.tsx` | 245 |
| `ums-app/src/components/Layout/HelpModal.tsx` | `// Path: ums-app/src/components/Layout/HelpModal.tsx` | 135 |
| `ums-app/src/components/Layout/FileLuSetupModal.tsx` | `// Path: ums-app/src/components/Layout/FileLuSetupModal.tsx` | 105 |
| `ums-app/src/context/ToastContext.tsx` | `// Path: ums-app/src/context/ToastContext.tsx` | 65 |