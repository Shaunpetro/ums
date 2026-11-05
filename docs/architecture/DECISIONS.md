# Architecture Decision Log

Path: docs/architecture/DECISIONS.md
Last updated: 2026-11-05

Each entry records a locked decision. Locked decisions require Pre-Change Discussion (rule 15) and Shaunpetro sign-off to alter. Entries are append-only; superseded decisions are marked SUPERSEDED with a reference to the newer decision.

---

## DEC-001: Primary storage = Gozunga
*(Content preserved - see git history for full text)*

## DEC-002: Authentication = Autentico
*(Content preserved - see git history for full text)*

## DEC-003: Email provider = Resend
*(Content preserved - see git history for full text)*

## DEC-004: Desktop notifications = Tauri plugin
*(Content preserved - see git history for full text)*

## DEC-005: File sync = rclone bisync
*(Content preserved - see git history for full text)*

## DEC-006: Collaborative editor = Diwan
*(Content preserved - see git history for full text)*

## DEC-007: Offline co-editing = Phase 4
*(Content preserved - see git history for full text)*

## DEC-008: Revocation = short-lived tokens + revocation list
*(Content preserved - see git history for full text)*

## DEC-009: Selective sync = exclude filters + pre-signed fetch
*(Content preserved - see git history for full text)*

## DEC-010: Device security = encrypted cache + device registry + soft wipe
*(Content preserved - see git history for full text)*

## DEC-011: Code signing = unsigned Phase 1, MSIX Store later
*(Content preserved - see git history for full text)*

## DEC-012: POPIA = retention.json + audit logs sufficient Phase 1
*(Content preserved - see git history for full text)*

## DEC-013: Windows-only Phase 1
*(Content preserved - see git history for full text)*

## DEC-014: Tenant model = single bucket, prefix-isolated
*(Content preserved - see git history for full text)*

## DEC-015: Capability tokens carry org, dept, and UI capabilities
*(Content preserved - see git history for full text)*

## DEC-016: Dashboard = tab-isolated pipelines
*(Content preserved - see git history for full text)*

## DEC-017: Audit trail = sidecar JSON on every write
*(Content preserved - see git history for full text)*

## DEC-018: Version restore = super-user only, logged as new version
*(Content preserved - see git history for full text)*

## DEC-019: Schema evolution = schema_version + migrate-on-read
*(Content preserved - see git history for full text)*

## DEC-020: Backup = versioning + independent nightly snapshot
*(Content preserved - see git history for full text)*

## DEC-021: Shortcut repair = in binary, Task Scheduler trigger
*(Content preserved - see git history for full text)*

## DEC-022: Update = Tauri updater, sign-after-Authenticode
*(Content preserved - see git history for full text)*

## DEC-023: Git model = main protected, squash merges, stage branches
*(Content preserved - see git history for full text)*

## DEC-024: Two doc sets
*(Content preserved - see git history for full text)*

## DEC-025: Handover = 12 fixed sections
*(Content preserved - see git history for full text)*

## DEC-026: Fail-safe alignment = 4-signature verification
*(Content preserved - see git history for full text)*

## DEC-027: Assets = source-first SVG
*(Content preserved - see git history for full text)*

## DEC-028: Placeholder keys in chat, real keys in DEV-GUIDE
*(Content preserved - see git history for full text)*

## DEC-030: Primary storage = FileLu S5 (100 GB, S3-compatible)
*(Content preserved - see git history for full text)*

## DEC-031: Routing = React Router DOM
*(Content preserved - see git history for full text)*

## DEC-032: Icons = Lucide React
*(Content preserved - see git history for full text)*

## DEC-033: Styling = Vanilla CSS + Custom Properties
*(Content preserved - see git history for full text)*

## DEC-034: Global Upload Context
*(Content preserved - see git history for full text)*

## DEC-035: Async Background Uploads
*(Content preserved - see git history for full text)*

## DEC-036: Native Downloads
*(Content preserved - see git history for full text)*

## DEC-037: Dynamic File Icons
*(Content preserved - see git history for full text)*

## DEC-038: Installer format = NSIS
*(Content preserved - see git history for full text)*

## DEC-039: Updater = Tauri plugin, GitHub Releases endpoint
*(Content preserved - see git history for full text)*

## DEC-040: Release pipeline = GitHub Actions
*(Content preserved - see git history for full text)*

## DEC-041: Runtime secret delivery = OS keyring
*(Content preserved - see git history for full text)*

## DEC-042: Version heartbeat deferred to Autentico
*(Content preserved - see git history for full text)*

## DEC-043: Multi-user sync config lifecycle
*(Content preserved - see git history for full text)*

---

## DEC-044: Hybrid "Ping IT" Support System

**Decision:** IT support pings write a JSON payload to `ums/orgs/{org-id}/it_alerts/` in S3, and trigger a stubbed email notification via Resend. 
**Reason:** Provides immediate in-app context (S3) while preparing for an asynchronous email fallback (Resend) without requiring third-party chat apps on the user's PC. Uses existing infrastructure.

**Locked:** yes
**Date:** 2026-11-03

---

## DEC-045: System Tray & Background Sync

**Decision:** The app minimizes to the Windows System Tray on window close instead of terminating. The `notify` file watcher remains active in the background. Auto-start on boot is enabled.
**Reason:** To function as a backup and sync tool, the app must run continuously. Closing the window should not stop the sync engine. Tray icon provides a way to manually quit.

**Locked:** yes
**Date:** 2026-11-03

---

## DEC-046: Windows Installer Identity

**Decision:** `productName` is "Ubuveil Management System", `mainBinaryName` is "ums-app", and Publisher is "ATG (Pty) Ltd".
**Reason:** Decouples the user-facing display name (Start Menu, Windows Settings) from the underlying file paths and binary name. This allows existing installations to update seamlessly without changing the folder structure or breaking uninstallers.

**Locked:** yes
**Date:** 2026-11-03

---

## DEC-047: FileLu API Polling Limits

**Decision:** Storage usage polling is set to 1 hour (3,600,000ms). 
**Reason:** FileLu's free tier has a hard limit of 1,000 requests per day. Polling every 30 seconds (2,880 requests/day) caused immediate API lockouts. 1 hour allows 24 requests/day, leaving ample headroom for file uploads and downloads across multiple users.

**Locked:** yes
**Date:** 2026-11-04

---

## DEC-048: Local On-Premise Auth & Staged Revocation

**Decision:** Autentico will be hosted locally on a LAN machine (Windows/Raspberry Pi) to avoid cloud hosting costs and Oracle capacity issues. Authentication uses 30-day JWTs to allow offline work. Offboarding uses a 3-phase staged revocation protocol (Active -> Upload-Only -> Frozen).
**Reason:** Eliminates the need for a public-facing server and domain while ensuring company files are not downloaded by suspended users, though their last 48 hours of work is preserved to the cloud.

**Locked:** yes
**Date:** 2026-11-05