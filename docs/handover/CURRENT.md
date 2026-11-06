# CURRENT - Live State

Path: docs/handover/CURRENT.md

**Last handover:** `01-stage-01-ui-shell.md`
**Current branch:** `stage/01-ui-shell` (Stage 02 branch `stage/02-installer-updates` to be created after the multi-user work is committed)
**Stage:** 02 - Installer and Live Updates (pre-flight)
**Current work item:** Document updates complete. Code replacement begins after commit of multi-user work and signature verification of the files to be touched.
**Files being edited:** `docs/architecture/DECISIONS.md`, this file.
**Last commit:** (pending; the multi-user work from the previous chat must be committed before this state is accurate)
**Blockers:** None blocking. Oracle VPS provisioning for Autentico remains in capacity loop; DEC-042 defers the version heartbeat until Autentico is live.

---

## Pre-change proposal status

Approved 2026-11-02. Six decisions recorded in DECISIONS.md as DEC-038 through DEC-043.

## Stage 02 scope

1. Commit the multi-user sync configs and dynamic dashboard work as one atomic commit.
2. Append DEC-034 through DEC-043 to `DECISIONS.md`.
3. Replace this file with the Stage 02 pre-flight state.
4. Replace `tauri.conf.json`, `capabilities/default.json`, `Cargo.toml`, `lib.rs` for updater integration, NSIS installer, keyring secrets, and multi-user lifecycle fixes.
5. Add `.github/workflows/release.yml` (new file).
6. Update `DEV-GUIDE.md` (untracked) with signing key custody and build/release steps.
7. Manual build; verify `.sig` and NSIS `.exe` produced.
8. Push release tag; verify `latest.json` attached to GitHub release.
9. Install on one PC; bump version; push again; confirm auto-update fires.
10. Roll to other two PCs.
11. Write `02-stage-02-installer-updates.md` in 12-section format; close Stage 02.

## Files in scope for Stage 02

| Path | Change |
| :--- | :--- |
| `docs/architecture/DECISIONS.md` | Append DEC-034 through DEC-043 |
| `docs/handover/CURRENT.md` | Replace with Stage 02 pre-flight state |
| `ums-app/src-tauri/tauri.conf.json` | Add updater plugin config, `bundle.createUpdaterArtifacts: true`, `bundle.targets: ["nsis"]` |
| `ums-app/src-tauri/capabilities/default.json` | Add `updater:default` |
| `ums-app/src-tauri/Cargo.toml` | Add `tauri-plugin-updater`, `tauri-plugin-process`, `keyring` |
| `ums-app/src-tauri/src/lib.rs` | Keyring secrets, watcher lifecycle, prefix fix, streaming uploads |
| `.github/workflows/release.yml` | New file |
| `docs/dev/DEV-GUIDE.md` | Untracked; signing key custody and release steps |
| `docs/handover/02-stage-02-installer-updates.md` | New file at stage close |

## Rules for this file

- Updated continuously, not at stage boundaries.
- Reflects working tree state, not last commit.
- If lost, the last handover plus `git status` reconstructs everything.
- Do not put real keys, real secrets, or PII here.

# CURRENT - Live State

Path: docs/handover/CURRENT.md

**Last handover:** `02-stage-02-installer-updates.md` (to be written at stage close)
**Current branch:** `stage/02-installer-updates`
**Stage:** 03 - Branding, System Tray & UX Polish
**Current work item:** Implementing background sync, tray menu, and Ping IT support skeleton.
**Files being edited:** `tauri.conf.json`, `Cargo.toml`, `lib.rs`, `AppShell.tsx`, `HelpModal.tsx`
**Blockers:** None.

---

## Stage 03 Scope (Locked)
1. **Branding:** Update `productName` to "Ubuveil Management System", `mainBinaryName` to "ums-app", publisher to "ATG (Pty) Ltd". Generate icons from SVGs.
2. **System Tray:** OneDrive-style minimize to tray. Closing window hides it. Right-click tray menu (Open, Quit).
3. **Background Sync:** Watcher stays alive in tray. Auto-start on boot.
4. **Layout & UI:** Footer (`Ubuveil MS (c) ARR` | `v0.1.2 | Last Updated`). Sidebar (FileLu dot, Storage meter, User). Toast notifications instead of alerts.
5. **Ping IT:** Hybrid S3 + Resend skeleton. Help modal gets a support button that writes an alert to S3.

## Rules for this file
- Updated continuously, not at stage boundaries.
- Reflects working tree state, not last commit.

# CURRENT - Live State

Path: docs/handover/CURRENT.md

**Last handover:** `02-stage-02-installer-updates.md`
**Current branch:** `stage/02-installer-updates`
**Stage:** 03 - Branding, System Tray & UX Polish
**Current work item:** Testing Stage 03 features locally before pushing tag `app-v0.1.2`.
**Files being edited:** None currently. All code saved.
**Blockers:** None. FileLu API limit has reset.

---

## Stage 03 Status
- [x] Branding (Icons, Windows Settings Name, Publisher)
- [x] System Tray (Minimize to tray, Quit menu)
- [x] Background Sync (Watcher stays active)
- [x] Layout (Footer, Sidebar FileLu status clickable, Toast notifications)
- [x] Ping IT (S3 Alert skeleton)
- [ ] Local Test & Smoke Test
- [ ] Push tag `app-v0.1.2`

## Rules for this file
- Updated continuously, not at stage boundaries.
- Reflects working tree state, not last commit.

# CURRENT - Live State

Path: docs/handover/CURRENT.md

**Last handover:** `03-stage-03-branding-tray.md`
**Current branch:** `stage/02-installer-updates`
**Stage:** 03 - Branding, System Tray & UX Polish (Complete)
**Current work item:** Pushing release tag `app-v0.1.2` for CI build.
**Files being edited:** None.
**Blockers:** None.

---

## Stage 03 Status
- [x] Code & Docs committed.
- [x] Local build successful.
- [x] Push tag `app-v0.1.2`.

## Rules for this file
- Updated continuously, not at stage boundaries.
- Reflects working tree state, not last commit.

# CURRENT - Live State

Path: docs/handover/CURRENT.md

**Last handover:** `03-stage-03-branding-tray.md`
**Current branch:** `stage/02-installer-updates`
**Stage:** 03 - Branding, System Tray & UX Polish (Finalizing)
**Current work item:** Preparing to tag `app-v0.1.8` after final local build verification.
**Files being edited:** None. Code is stable.
**Blockers:** FileLu Free Tier API limit (mitigated via caching and local fallback).

---

## Stage 03 Status
- [x] Branding (Icons, Windows Settings Name, Publisher)
- [x] System Tray (Minimize to tray, Quit menu)
- [x] Background Sync (Watcher stays active)
- [x] Layout (Footer, Sidebar FileLu status clickable, Toast notifications)
- [x] Ping IT (S3 Alert skeleton + Native Notification poller)
- [x] File Viewer (Full-screen PDF/Text/Image renderer)
- [x] File Cache (Zero-API viewing for previously opened files)
- [x] API Limit Mitigation (1-hour polling, local fallback)
- [ ] Push tag `app-v0.1.8` to trigger CI

## Known Bugs / Limitations
- **Bidirectional Sync:** The app currently only uploads local changes. Changes made by other users to the S3 bucket do not automatically download to the local sync folder. (Deferred to Phase 2).
- **FileLu Free Tier API Limit:** Even with 1-hour polling, heavy browsing of files NOT in your local folder or cache may eventually hit the 1000/day limit. The app handles this gracefully with an "Offline Mode" fallback.

## Rules for this file
- Updated continuously, not at stage boundaries.
- Reflects working tree state, not last commit.

# CURRENT - Live State

Path: docs/handover/CURRENT.md

**Last handover:** `03-stage-03-branding-tray.md`
**Current branch:** `stage/02-installer-updates`
**Stage:** 03 - Branding, System Tray & UX Polish (Complete)
**Current work item:** Local smoke test of `v0.1.9` before pushing the tag.
**Files being edited:** None. Code compiles successfully.
**Blockers:** None. API limit issues mitigated via batch queue.

---

## Stage 03 Status
- [ ] Branding (Icons, Windows Settings Name, Publisher)
- [x] System Tray (Minimize to tray, Quit menu)
- [x] Background Sync (1-hour batch queue, manual "Sync Now")
- [x] Layout (Footer status, Sidebar connection dot, Toast notifications)
- [x] Ping IT (S3 Alert skeleton + Native Notification poller)
- [x] File Viewer (Full-screen PDF/Text/Image renderer)
- [x] File Cache (Zero-API viewing for previously opened files)
- [x] UI Polish (Grid/List toggle, persistent Sort toggle, Filter)
- [x] CI Fix (Auto-updater `latest.json` generation)
- [ ] Local Smoke Test
- [ ] Push tag `app-v0.1.9`

## Rules for this file
- Updated continuously, not at stage boundaries.
- Reflects working tree state, not last commit.