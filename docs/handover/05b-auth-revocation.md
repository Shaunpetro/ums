# UMS Stage 05b: Auth Revocation

**Stage:** 05b
**Slug:** auth-revocation
**Date:** 2026-11-16
**Author:** Petro Malamule (Petro@ATG)
**Git branch:** `stage/02-installer-updates`
**Supersedes:** `05a-auth-foundation.md`

## 1. Stage Metadata
- **Project:** Ubuveil Management System (UMS)
- **Developer:** Petro Malamule
- **Target platform:** Windows 10/11

## 2. Prior Handover Reference
- **Previous:** `05a-auth-foundation.md`

## 3. Where the Project Started
Stage 05a delivered Autentico-backed login with RS256 verification, offline-tolerant boot, and OS keyring storage. The server could identify and return `suspended` or `revoked` statuses, but the client did not act on them.

## 4. Where the Project Is Now
The client enforces revocation. A `SyncMode` state (`Active`, `UploadOnly`, `Disabled`) is held securely in Rust backend memory (immune to file tampering). Suspended users are blocked from downloading files, previewing cloud files, and generating presigned URLs. The UI displays persistent warning banners when in a restricted state, and the footer status correctly reflects "Upload Only" or "Sync Suspended".

## 5. What Was Done This Stage
- `S05b-T01`: Updated `lib.rs` with `SyncMode` enum and `check_download_allowed` guard.
- `S05b-T02`: Added `state.sync_mode` to `AppState` and updated `autentico_validate` to mutate it based on server response.
- `S05b-T03`: Patched all S3 read/download commands (`list_files`, `cache_file_from_cloud`, `open_file_natively`, `get_share_url`, `download_file`) to respect the sync mode.
- `S05b-T04`: Updated `AuthContext.tsx` to track `syncMode` and immediately validate on login/boot, plus 6-hour background interval.
- `S05b-T05`: Added suspension and revocation banners to `AppShell.tsx` and updated footer status indicators.

## 6. Known Bugs Not Fixed
- None. Revocation protocol functions as designed.

## 7. Current Workings
- **Branch:** `stage/02-installer-updates`
- **Version:** `0.2.4` (Unbumped, will be `0.2.5` on release)

## 8. Next Steps
- `S05b-N01`: Implement quarantine uploads for suspended users (uploads to `{org}/suspended_uploads/`).
- `S05b-N02`: Stage 05c (Offline grace hardening and key rotation).
- *Note:* Investigate Workspace/Multi-tenancy logic (pending).

## 9. Decision Log
- **DEC-058:** Offline-Trust Auth Strategy and Accepted Risks. (Applied here via in-memory sync mode).

## 10. Dependency Inventory
- Same as Stage 05a.

## 11. Rollback Contract
`git reset --hard post-auth-05a`

## 12. Fail-Safe Alignment
| Path | First line (SIG-1) | Approx lines |
| :--- | :--- | :--- |
| `ums-app/src-tauri/src/lib.rs` | `// Path: ums-app/src-tauri/src/lib.rs` | ~1220 |
| `ums-app/src/context/AuthContext.tsx` | `// Path: ums-app/src/context/AuthContext.tsx` | ~130 |
| `ums-app/src/components/Layout/AppShell.tsx` | `// Path: ums-app/src/components/Layout/AppShell.tsx` | ~420 |