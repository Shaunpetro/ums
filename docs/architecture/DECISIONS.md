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

---

## DEC-002 (marker): SUPERSEDED

**Superseded by:** DEC-048 (Local On-Premise Auth & Staged Revocation) and `docs/architecture/LOCAL-AUTH-STRATEGY.md`.

**Reason:** The original DEC-002 assumed a cloud-VPS Autentico deployment. DEC-048 and LOCAL-AUTH-STRATEGY.md replaced that with LAN-hosted Autentico to eliminate cloud costs and Oracle capacity issues. The authentication provider decision (Autentico) is unchanged; only the deployment topology was superseded.

**Locked:** yes
**Date:** 2026-11-13
**Signed off by:** Shaunpetro (pending)

---

## DEC-058: Offline-Trust Auth Strategy and Accepted Risks

**Decision:**

Existing user sessions remain valid offline for the full JWT TTL (30 days) without requiring server validation on boot. Server `validate` is advisory: its success updates `sync_mode` and reports suspension/revocation status, but its failure (Autentico unreachable) does not force logout. Only new logins and expired-token users require Autentico reachable.

RS256 signature verification against a client-pinned public key is required on every local JWT check in Stage 05a (pulled forward from original 05c scope). Forged tokens are rejected at boot. This closes loophole L2 (JWT payload tampering for capability escalation).

Suspension and revocation (Stage 05b) use quarantine uploads: files with `mtime >= suspended_at` upload to `{org}/suspended_uploads/{user}/{date}/` for admin review. Files with `mtime < suspended_at` upload to the user's normal S3 path. Downloads during the blind window (post-suspension, pre-detection) are logged to audit.

Deployment to non-developer users occurs after Stage 05b. Stage 05c is hardening backlog, not blocking.

**Accepted, documented risks of the cooperative security model:**

1. **L1 - `sync_mode` tampering:** mitigated by holding `sync_mode` in Rust process memory, never on disk. Residual risk (binary patching) accepted.
2. **L3 - clock manipulation:** partial mitigation via `server_time` in validate responses, cached as `last_successful_validate_at`. If `now_local - last_successful_validate_at > 30 days`, boot refuses login. Full mitigation requires server-authoritative enforcement (not implemented). Accepted.
3. **L5 - shared S3 credentials:** all users have identical FileLu access. Prefix isolation is convention, not IAM. A suspended user with cached creds can upload directly to any S3 path for up to their JWT TTL. Mitigated operationally by revoking FileLu credentials on termination (manual step in offboarding runbook). Accepted for the 8-user trusted environment.
4. **L6 - suspension learned via validate only:** a suspended user may work up to 6 hours after suspension without learning status (6-hour validate cadence). Accepted.
5. **L8 - file mtime forgeable:** quarantine sorting is cooperative. A user can backdate post-suspension files. Accepted.

**Rejected alternative:** enforcing server-authoritative validation on every boot was rejected because it reintroduces the "must be on LAN every launch" constraint this strategy specifically avoids.

**Related mitigations folded into this decision:**
- Banking details visible only to `admin:finance` holders (loophole L9). Company Profile banking section is hidden entirely for users without this capability.
- Admin CLI requires bootstrap token (loophole L7). `autentico seed` and `autentico user` refuse to run without `--bootstrap-token` matching `AUTENTICO_BOOTSTRAP_TOKEN`.
- API version header (`X-Autentico-API-Version: 1`) prevents silent breakage when Autentico evolves (loophole L4).

**Locked:** yes
**Date:** 2026-11-13
**Signed off by:** Shaunpetro (accepted 2026-11-13)


**DEC-057 clarifications (appended 2026-11-13):**

- Banking details within Company Profile are visible only to users with `admin:finance`. Users with only `admin:profile` can edit identity, compliance, and email templates but cannot see or edit banking. This is enforced in `CompanyProfile.tsx` by gating the banking section on `admin:finance`. No new `read:banking` capability is introduced; `admin:finance` alone gates both view and edit of banking.
- Per DEC-058, this gating is part of loophole L9 mitigation (bank account details are sensitive financial data; read visibility should not be granted implicitly to all profile viewers).