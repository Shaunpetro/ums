# Architecture Decision Log

Path: docs/architecture/DECISIONS.md
Last updated: 2026-11-02

Each entry records a locked decision. Locked decisions require Pre-Change Discussion (rule 15) and Shaunpetro sign-off to alter. Entries are append-only; superseded decisions are marked SUPERSEDED with a reference to the newer decision.

---

## DEC-001: Primary storage = Gozunga

**Decision:** Primary S3-compatible storage is Gozunga (100GB/month free).

**Reason:** Meets 100GB free requirement without developer-program approval delay. Full S3 API compatibility. Alternative FileLu offers 100GB lifetime only via developer program (blocks Phase 1). Cloudflare R2 offers only 10GB free.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-002: Authentication = Autentico

**Decision:** Identity provider is Autentico, a single Go binary backed by SQLite, self-hosted on one VPS.

**Reason:** Single binary, no external database, full OAuth2/OIDC, RS256 JWTs, token introspection, admin UI. Alternatives rejected: Authelia (forward-auth gateway, not standalone IdP), Keycloak (500MB+ RAM idle), Vercel serverless (no persistent state).

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-003: Email provider = Resend

**Decision:** Transactional email via Resend. Free tier 3,000/month permanent.

**Reason:** Permanent free tier (SendGrid is 60-day trial only). Cleanest API. React Email template support. SES has no free tier for new signups and setup friction.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-004: Desktop notifications = Tauri plugin

**Decision:** Native Windows toast notifications via `tauri-plugin-notifications`. Email is fallback, not primary.

**Reason:** Zero server round-trip when app is running. Native OS integration. Falls back to email only for async cases (invitations, password resets, digests).

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-005: File sync = rclone bisync

**Decision:** `rclone bisync` is the file distribution engine, embedded in the Tauri app.

**Reason:** Mature, bidirectional, conflict detection, preserve-both default policy. Alternatives rejected: custom sync engine (weeks of work), Syncthing (peer-to-peer, no central source of truth), rsync (one-way only).

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-006: Collaborative editor = Diwan

**Decision:** Real-time collaborative editing via Diwan (single binary, CRDT-native).

**Reason:** Single Go binary with embedded frontend, no external database, CRDT-native, runs on own storage. Nextcloud Write rejected (heavier, full infrastructure stack).

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-007: Offline co-editing = Phase 4

**Decision:** Offline collaborative editing is deferred to Phase 4.

**Reason:** Diwan's offline sync layer is not yet complete upstream. Phase 1 does not block on it. Integration is additive; does not touch sync agent or token schema.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-008: Revocation = short-lived tokens + revocation list

**Decision:** Access tokens have 15-30 minute TTL. Revocation list maintained per organization at `ums/orgs/{org-id}/auth/revoked.json`. No introspection-on-write in Phase 1.

**Reason:** Bounds offline revocation window to token TTL without per-write network latency. Introspection-on-write can be added later as a config flag without changing token schema.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-009: Selective sync = exclude filters + pre-signed fetch

**Decision:** Large folders excluded via `rclone --exclude` filter file. Dashboard fetches excluded files on demand via pre-signed URL. Full local hydration (placeholder files that download on open) deferred to Phase 2.

**Reason:** 90% of selective sync benefit with 10% of complexity. No custom hydration engine in Phase 1.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-010: Device security = encrypted cache + device registry + soft wipe

**Decision:** Local bisync cache encrypted at rest via OS keychain (`keyring` crate). Device ID registered in `ums/orgs/{org-id}/devices/{device-id}.json` on first login. On startup, revoked devices wipe their encrypted cache and refuse to start.

**Reason:** Mitigates common loss/theft cases without MDM dependency or full-disk encryption assumption. Not bulletproof against determined attackers with OS password, but closes the common case.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-011: Code signing = unsigned Phase 1, MSIX Store later

**Decision:** Tauri app ships unsigned in Phase 1. When ready for external distribution, package as MSIX via Microsoft Store (free re-signing).

**Reason:** OV certificates cost $150-300/year. EV certificates cost $400+/year and no longer provide instant SmartScreen bypass. MSIX through Store eliminates certificate cost and reputation-building entirely. Internal Phase 1 can tolerate SmartScreen warnings.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-012: POPIA = retention.json + audit logs sufficient Phase 1

**Decision:** Retention policy per organization in `ums/orgs/{org-id}/retention.json`. Nightly cleanup job deletes/redacts records past retention. Audit logs (DEC-017) satisfy Section 19 audit requirement. Formal DPA deferred until external customers onboarded.

**Reason:** Phase 1 is internal-only (one organization, own team). Full POPIA compliance overhead not warranted until external customers. Data model is compliant-ready; audit logs already satisfy the security requirement.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-013: Windows-only Phase 1

**Decision:** Phase 1 supports Windows 10/11 only.

**Reason:** All shortcut, Task Scheduler, and `.lnk` repair logic assumes Windows. macOS support (launchd, `.app`, Notification Center) doubles the platform integration surface with no Phase 1 benefit. Tauri codebase remains cross-platform-ready.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-014: Tenant model = single bucket, prefix-isolated

**Decision:** Single S3 bucket `ums-prod`. Organizations and departments isolated by prefix: `ums/orgs/{org-id}/departments/{dept-id}/...`. Shared org-wide files at `ums/orgs/{org-id}/shared/`.

**Reason:** Bucket-per-tenant creates sprawl, complicates IAM, and prevents cross-org reporting for super-users. Prefix isolation with scoped IAM keys provides equivalent security with simpler operations.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-015: Capability tokens carry org, dept, and UI capabilities

**Decision:** JWT payload includes `org`, `dept`, `role`, `capabilities` (array of UI capability strings), and `schema_version`. Issued by Autentico on login.

**Reason:** Token is the single source of truth for what a user can do. Enforced at three layers: S3 IAM policy (coarse), sync agent filter (per-scope), UI capability check (fine). Adding claims later requires reissuing all tokens.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-016: Dashboard = tab-isolated pipelines

**Decision:** Each dashboard tab maps to one pipeline prefix (`pipelines/tenders/`, `pipelines/invoices/`, `pipelines/projects/`, `pipelines/reports/`, `pipelines/tasks/`). Each pipeline has its own widget registry and config schema.

**Reason:** Schema evolution in one pipeline cannot break another. Blast radius contained. Adding a widget to Tenders does not touch Invoices.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-017: Audit trail = sidecar JSON on every write

**Decision:** Every write produces a companion audit record at `ums/orgs/{org-id}/audit/{yyyy}/{mm}/{dd}/{ts}-{uid}-{op}.json`.

**Reason:** S3 access logs are coarse (PUT/GET) and not business-level audit. Sidecar records are small, append-only, and independent of S3 provider changes. Satisfies POPIA Section 19 and enables restore/recovery.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-018: Version restore = super-user only, logged as new version

**Decision:** All users see version history and audit log. Only super-users and developers can execute restore. Restore writes a new version + audit event with `operation: restore`, `restored_from_version`, `restored_by`.

**Reason:** Read vs. write distinction prevents accidental rollback. Append-only audit prevents restore from being used to hide malicious edits. Standard pattern for business continuity.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-019: Schema evolution = schema_version + migrate-on-read

**Decision:** Every stored JSON has `schema_version` integer. On read, payload passes through migration registry that upgrades to current version. Writes never migrate. Applies to dashboards, branding manifests, tokens, notifications, retention policies.

**Reason:** Cheapest safe schema evolution. Adding a field later does not break existing configs. Cost now: one field and one function. Cost of retrofit: coordinated migration across all users.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-020: Backup = versioning + independent nightly snapshot

**Decision:** S3 versioning enabled on primary bucket. Nightly snapshot to second S3 provider (R2 or B2, Object Lock enabled). Snapshot runs outside the user's sync path.

**Reason:** Sync is not backup. Compromised token or sync bug propagates to primary bucket. Independent provider + Object Lock provides ransomware resilience and account-compromise recovery.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-021: Shortcut repair = in binary, Task Scheduler trigger

**Decision:** NSIS installer creates Desktop and Start Menu shortcuts. `UMS.exe --repair-shortcuts` function inside the signed binary recreates missing shortcuts. Windows Task Scheduler runs it at logon and daily 07:00.

**Reason:** Batch files are AV-flagged and silently fail. Repair logic in signed binary avoids AV false positives and updates automatically. Task Scheduler handles both logon and daily triggers cleanly.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-022: Update = Tauri updater, sign-after-Authenticode

**Decision:** Tauri built-in updater with staged rollout. `.sig` file generated after Authenticode signing. Version heartbeat includes `org_id`.

**Reason:** Sign-before-Authenticode causes silent update rejection. Staged rollout limits blast radius of broken updates. Heartbeat detects stale clients before they corrupt data.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-023: Git model = main protected, squash merges, stage branches

**Decision:** `main` protected, no direct pushes. Stage branches `stage/NN-slug` off main. Feature branches off stage branches. Squash merge stage to main.

**Reason:** Stage branches provide clear rollback points. Squash merges keep main history clean. Feature branches isolate WIP.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-024: Two doc sets

**Decision:** `docs/` in git. `docs/dev/DEV-GUIDE.md` gitignored (contains real keys). All other docs committed.

**Reason:** Handovers and architecture decisions belong in history. Real keys must never touch git.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-025: Handover = 12 fixed sections

**Decision:** Every handover contains 12 sections in fixed order (see rule 25).

**Reason:** Consistency enables verification. Missing sections = stage rejected. Enables zero-context handover per rule 35.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-026: Fail-safe alignment = 4-signature verification

**Decision:** Before accepting file content in chat, verify SIG-1 (first line), SIG-2 (line count), SIG-3 (last commit), SIG-4 (first+last line).

**Reason:** Chat does not know which files the user pastes. Signatures verify file identity before content. Prevents silent misalignment.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-027: Assets = source-first SVG

**Decision:** All custom visual assets authored as SVG sources in `assets/source/`. Generation commands in `assets/README.md`. No binary asset without source and command.

**Reason:** SVG sources are editable, diffable, versionable. Binary assets are opaque. Stock asset licensing is a legal risk when selling to external companies.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-028: Placeholder keys in chat, real keys in DEV-GUIDE

**Decision:** All keys provided in chat are placeholders for shape validation only. Real keys stored in `docs/dev/DEV-GUIDE.md` (gitignored) and shared via secure channel.

**Reason:** Chat logs are not secure. Placeholders let us validate format (prefix, length, pattern) without exposing real credentials. DEV-GUIDE is the single source of truth for real values.

**Locked:** yes
**Date:** 2026-10-28

---

## DEC-030: Primary storage = FileLu S5 (100 GB, S3-compatible)

**Decision:** Primary S3-compatible storage is FileLu S5.

**Reason:** Gozunga's regional signup block prevents use from South Africa. FileLu S5 provides a genuine S3-compatible API on all free plans, with 100 GB lifetime available via the developer program (publishing a tool that integrates with FileLu). Region-agnostic, no request fees.

**Supersedes:** DEC-029 (Cloudflare R2).
**Locked:** yes
**Date:** 2026-10-29

---

## DEC-031: Routing = React Router DOM

**Decision:** Use `react-router-dom` for navigation.
**Reason:** Allows the app to use real URLs (e.g., `/storage`, `/tenders`), makes back/forward navigation work, and cleanly separates views into isolated React components.

---

## DEC-032: Icons = Lucide React

**Decision:** Use `lucide-react` for all icons.
**Reason:** Provides a consistent, modern icon set that can be styled with standard CSS (`color`, `size`) and matches the clean aesthetic of the glassmorphism UI.

---

## DEC-033: Styling = Vanilla CSS + Custom Properties

**Decision:** Use standard CSS files with CSS Custom Properties (Variables) for theming.
**Reason:** Tailwind adds unnecessary class bloat for complex layouts like Kanban boards and custom glass effects. Vanilla CSS gives us absolute control over `backdrop-filter`, `conic-gradient`, and our dynamic light/dark mode tokens without a build-step penalty.

---

## DEC-034: Global Upload Context

**Decision:** Upload queue is managed via React Context in `ums-app/src/context/UploadContext.tsx`, provided at the app root.

**Reason:** Ensures background uploads persist across navigation between pipeline tabs, preventing accidental cancellation and providing a unified progress UI.

**Locked:** yes
**Date:** 2026-11-02

---

## DEC-035: Async Background Uploads

**Decision:** File uploads in Rust use `tauri::async_runtime::spawn`.

**Reason:** Prevents the Tauri UI from freezing during large transfers. Rust emits `upload-success` and `upload-error` events to update React asynchronously.

**Locked:** yes
**Date:** 2026-11-02

---

## DEC-036: Native Downloads

**Decision:** Downloads are written directly to the user's Windows `Downloads` folder via Rust `app.path().download_dir()`. Browser and S3 presigned-URL downloads are not used.

**Reason:** FileLu free tier blocks S3 pre-signed URLs (`AccessDenied`). A native download command bypasses the restriction entirely and gives a better desktop experience.

**Locked:** yes
**Date:** 2026-11-02

---

## DEC-037: Dynamic File Icons

**Decision:** File and folder icons are color-coded: PDF=red, Word=blue, Excel=green, Images=purple, Company folders=gold, Departments=blue, Standard folders=gray.

**Reason:** Adds scannable visual hierarchy without introducing custom icon assets (rule 41 unaffected). Colors chosen from the existing design token palette.

**Locked:** yes
**Date:** 2026-11-02

---

## DEC-038: Installer format = NSIS

**Decision:** Phase 1 installer is NSIS (`-setup.exe`). WiX MSI deferred.

**Reason:** Tauri's updater pipeline is most exercised against NSIS on Windows. WiX MSI has known v2 issues where updates succeed but leave the app on the old version when installed to a custom directory. NSIS preserves DEC-021 (shortcuts, `--repair-shortcuts`, Task Scheduler) without supersession.

**Locked:** yes
**Date:** 2026-11-02

---

## DEC-039: Updater = Tauri plugin, GitHub Releases endpoint

**Decision:** `tauri-plugin-updater` with `bundle.createUpdaterArtifacts: true`, endpoint `https://github.com/shaunpetro/ums/releases/latest/download/latest.json`. Signing keypair generated with `cargo tauri signer generate`. Public key in `tauri.conf.json`. Private key in `docs/dev/DEV-GUIDE.md` and the `TAURI_SIGNING_PRIVATE_KEY` GitHub Actions secret.

**Reason:** Exact combination recommended by Tauri release documentation for Windows-only distribution. `createUpdaterArtifacts` is mandatory for `.sig` generation. Endpoint must be HTTPS. Private key never enters git (rule 4).

**Supersedes:** partially amends DEC-022 by specifying the exact endpoint and signing-key custody. "Sign-after-Authenticode" ordering deferred because Phase 1 ships unsigned per DEC-011.
**Locked:** yes
**Date:** 2026-11-02

---

## DEC-040: Release pipeline = GitHub Actions

**Decision:** Single workflow at `.github/workflows/release.yml` using `tauri-apps/tauri-action@v0` on `windows-latest`. Triggered by tag push matching `app-v*`. Manual dispatch also enabled.

**Reason:** Tag-triggered releases make each release an explicit auditable event rather than every push to `main`. `app-v*` naming separates app releases from any future docs-only tags. Manual dispatch allows re-run on runner failure.

**Locked:** yes
**Date:** 2026-11-02

---

## DEC-041: Runtime secret delivery = OS keyring

**Decision:** FileLu credentials stored in Windows Credential Manager via the `keyring` crate. First-run flow writes credentials to keyring. `get_s3_client()` reads from keyring on every call. `dotenvy` remains as a dev-only fallback for `cargo tauri dev`.

**Reason:** `.env` at runtime does not exist on installed PCs. Keyring supports rotation without shipping a new installer and aligns with DEC-010's direction for the bisync cache. Baked-at-build and encrypted-config alternatives put secrets in the binary or add install-time complexity.

**Locked:** yes
**Date:** 2026-11-02

---

## DEC-042: Version heartbeat deferred to Autentico

**Decision:** The `org_id` version heartbeat defined in DEC-022 is deferred until Autentico is live. The updater itself is not blocked on Autentico.

**Reason:** Oracle VPS provisioning for Autentico is still in capacity loop. Phase 1 is 3 PCs on internal infrastructure; manual rollout verification substitutes for telemetry until the IdP exists. Deferral is explicit so it is not silently dropped.

**Supersedes:** partially defers DEC-022.
**Locked:** yes
**Date:** 2026-11-02

---

## DEC-043: Multi-user sync config lifecycle

**Decision:** Array-of-configs `sync_configs.json` (from the shipped multi-user work) is the accepted baseline. `save_sync_config` stops the previous watcher for the same prefix before starting the new one. The boot loop starts watchers only for the currently authenticated UMS user.

**Reason:** On-disk array is correct. Two defects remain in `lib.rs`: re-mapping leaves a duplicate watcher on the old path; boot loop starts watchers for users who are not logged in, causing concurrent sync on shared PCs. Both fixes are local to `lib.rs`.

**Locked:** yes
**Date:** 2026-11-02