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

## DEC-044: Hybrid "Ping IT" Support System
*(Content preserved - see git history for full text)*

## DEC-045: System Tray & Background Sync
*(Content preserved - see git history for full text)*

## DEC-046: Windows Installer Identity
*(Content preserved - see git history for full text)*

## DEC-047: FileLu API Polling Limits
*(Content preserved - see git history for full text)*

## DEC-048: Local On-Premise Auth & Staged Revocation
*(Content preserved - see git history for full text)*

---

## DEC-049: File Viewer & Metadata Cache

**Decision:** File previews and native file openings (Word, Excel, etc.) prioritize a local metadata cache (`%APPDATA%/com.petro-malamule.ums-app/file_cache/`) over Cloud API calls. Cache validity is strictly determined by matching the `last_modified` timestamp from S3, with a 500 MB LRU eviction limit.
**Reason:** To eliminate unnecessary FileLu API calls when users view files that have already been downloaded. Strict timestamp matching ensures users always see the latest version without relying on arbitrary TTLs.

**Locked:** yes
**Date:** 2026-11-05

---

## DEC-050: FileLu API Rate Limit Mitigation

**Decision:** 
1. Storage usage polling is set to 1 hour.
2. IT Alert polling is set to 1 hour.
3. If the Cloud `list_files` fails due to API limits, the UI falls back to reading the local sync directory (`list_local_files`).
4. Error messages are mapped from raw AWS XML to human-readable strings (e.g., "Daily API limit exceeded").
**Reason:** FileLu's free tier limits requests to 1000/day. 1-hour polling leaves ample headroom for actual file operations, while the local fallback ensures the app remains usable even when the API quota is exhausted.

**Locked:** yes
**Date:** 2026-11-05

---

## DEC-051: Local-First Native Opening

**Decision:** The `open_file_natively` Rust command checks the local sync folder, then the metadata cache, and only hits the S3 API as a last resort.
**Reason:** Opening a file in Microsoft Word should not consume API quota or fail if the user is offline. This ensures local files open instantly.

**Locked:** yes
**Date:** 2026-11-05

---

## DEC-052: Persistent UI State

**Decision:** User preferences for View Mode (Grid/List), Sort Mode (Name/Date), and last visited Route are saved to `localStorage`.
**Reason:** Prevents user frustration from reconfiguring the view every time the app restarts.

**Locked:** yes
**Date:** 2026-11-06

---

## DEC-053: Public GitHub Repository

**Decision:** The `shaunpetro/ums` repository is public.
**Reason:** Private repos on GitHub Free are billed for CI minutes after 2,000 minutes/month, which caused workflow failures. Public repos get unlimited free minutes. No secrets are committed (`.env` and `docs/dev/` are gitignored).

**Locked:** yes
**Date:** 2026-11-06

# Architecture Decision Log

Path: docs/architecture/DECISIONS.md
Last updated: 2026-11-11

*(Previous DEC-001 to DEC-053 preserved in git history)*

---

## DEC-054: Company > Users Hierarchy

**Decision:** The Company (Tenant) is the root container. Users exist within the Company. 
**Reason:** Company-level compliance, branding, and financial settings dictate the user experience. Users cannot exist outside a company context.

**Locked:** yes
**Date:** 2026-11-11

---

## DEC-055: VSC Mining Role-Based Access Control (RBAC) Matrix

**Decision:** 
- **Shadrack (CEO):** Super Admin (RW all).
- **Petro (DevOps):** Super Admin (RW all).
- **Palesa (PA):** RW Executive, RW Finance (Invoicing), RW Tenders.
- **Hector (PM):** Read (R) all departments, RW Management.
- **Edward (Tech):** RW Management, R DevOps.
- **Marshall (Finance):** RW Finance, RW Management, RW Executive (Assists CEO).
- **Angela (Accountant):** RW Finance.
- **Thapelo (HR):** RW HR.
- **Company Profile Access:** Hector, Petro, Marshall can edit. All others can read.

**Reason:** Reflects the operational reality of a small, high-trust family business while protecting sensitive HR/Finance data.

**Locked:** yes
**Date:** 2026-11-11

---

## DEC-056: Email Template & Sending Strategy

**Decision:** Company email templates (HTML Header/Footer) are stored in the Company Profile JSON (`ums/orgs/{org-id}/company_profile.json`). Emails are composed in the frontend UI and dispatched via the Rust backend to Resend.
**Reason:** Allows the company to maintain marketing-style branding without hardcoding HTML in the binary.

**Locked:** yes
**Date:** 2026-11-11