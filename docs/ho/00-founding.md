
# Ubuveil Management System - Founding Handover

**Stage:** 00
**Slug:** founding
**Date:** 2026-10-28
**Author:** Petro Malamule (Petro@ATG)
**Git branch:** main (initial commit, no merge yet)
**Rules version active:** 2.0
**Supersedes:** N/A - this is the founding document.

---

## 1. Stage Metadata

- **Project:** Ubuveil Management System (UMS)
- **Developer:** Petro Malamule
- **GitHub:** shaunpetro
- **Email:** petrographics.adm@gmail.com
- **Company:** ATG DesEng (PTY) LTD
- **Copyright:** Ubuveil Apps (c) 2025/6 by Petro@ATG
- **Developer WhatsApp:** https://wa.me/27813877744
- **Root folder:** `E:\Creative Cloud\Design\2026\atg\Dev\Ubuveil UMS`
- **Stack:** Tauri 2.x (Rust) + React 18 (TypeScript) + S3-compatible storage (Gozunga) + Autentico IdP + Resend email
- **Target platform (Phase 1):** Windows 10/11 only
- **IDE:** Cursor (with built-in terminal)

---

## 2. Prior Handover Reference

N/A - founding document. All subsequent handovers must reference this file by filename and commit hash in their section 2.

---

## 3. Where the Project Started

UMS began as a design conversation about a local-first CRM/CSM/project management platform for ATG DesEng (PTY) LTD, with the goal of selling it to external companies later. The initial brief was file sharing with role-based access; the target state is a full dashboard for tenders, invoices, tasks, reports, and project workflows. The founding question was whether a local-first desktop app could combine with cloud storage as the source of truth. That question was answered yes across 10 design conversations, and the architecture below is the result. No code, no infrastructure, and no accounts existed before this handover.

---

## 4. Where the Project Is Now

Nothing is built. This handover creates the documentation spine: rules, decision log, handover format, fail-safe protocol, asset framework, and the first stage plan. The repository `shaunpetro/ums` is created but contains only these documents. No external services are provisioned. No cloud storage bucket exists. No VPS exists. No email provider account exists. Everything is ready to begin Stage 00 - Infrastructure.

---

## 5. What Was Done This Stage

- `S00-T01`: Full architecture defined across 10 design conversations. See section 9.
- `S00-T02`: 43 absolute rules written (v2.0). See `docs/rules/RULES.md`.
- `S00-T03`: Documentation directory structure defined. See section 10.
- `S00-T04`: Handover format defined - 12 fixed sections. See section 10.
- `S00-T05`: Fail-safe alignment protocol defined - 4-signature verification. See section 11.
- `S00-T06`: Git branching model defined. See section 10 and rule 12.
- `S00-T07`: Six structural loops identified and closed. See decisions DEC-017 through DEC-022.
- `S00-T08`: Ten Tier-1 and Tier-2 gaps identified and resolved. See decisions DEC-001 through DEC-026.
- `S00-T09`: Asset framework defined - source-first SVG, kebab-case, generation commands. See `docs/handover/00a-assets.md`.
- `S00-T10`: Placeholder key conventions locked. See section 13.
- `S00-T11`: DEV-GUIDE.md structure defined (gitignored, contains real keys). See section 14.

---

## 6. Known Bugs Not Fixed

None. No code exists yet.

---

## 7. Current Workings

At the time of writing:

- **Open branches:** none (only `main` exists after first commit).
- **Uncommitted changes:** none after this handover is committed.
- **Pending decisions:** none. All Tier-1 and Tier-2 decisions locked per section 9.
- **Blocked items:** Stage 00 Phase 0.2 (cloud provisioning) is blocked pending placeholder key shapes from user.

---

## 8. Next Steps

1. `S00-N01`: User runs local setup commands (folder structure, tool verification). See stage 00 kickoff.
2. `S00-N02`: User commits founding handover to `main`.
3. `S00-N03`: User creates `stage/00-infrastructure` branch.
4. `S00-N04`: User provides placeholder key shapes for the 6 keys in section 13.
5. `S00-N05`: Provision Gozunga bucket `ums-prod` + IAM keys per DEC-001.
6. `S00-N06`: Provision VPS for Autentico per DEC-002.
7. `S00-N07`: Provision Resend account + verify domain per DEC-003.
8. `S00-N08`: Write `docs/dev/DEV-GUIDE.md` (gitignored) with real keys.
9. `S00-N09`: Write Stage 00 completion handover `01-stage-00-infrastructure.md`.
10. `S00-N10`: Merge `stage/00-infrastructure` to `main` via squash merge.

---

## 9. Decision Log

All decisions locked unless Pre-Change Discussion (rule 15) initiated and signed off by Shaunpetro.

- **DEC-001: Primary storage = Gozunga.** 100GB/month free, S3-compatible. Single bucket `ums-prod`, prefix-isolated tenants. Versioning enabled. Alternatives rejected: FileLu (developer program delays), Cloudflare R2 (10GB too small).
- **DEC-002: Authentication = Autentico.** Single Go binary + SQLite, self-hosted on one VPS. Alternatives rejected: Authelia (forward-auth not standalone IdP), Keycloak (500MB+ RAM), Vercel serverless (no persistent state).
- **DEC-003: Email = Resend.** 3,000/month permanent free tier. Alternatives rejected: SendGrid (60-day trial), SES (no free tier).
- **DEC-004: Desktop notifications = Tauri plugin.** Native Windows toasts. Email is fallback only.
- **DEC-005: File sync = rclone bisync.** Default conflict: preserve both, surface in UI. S3 versioning as backstop.
- **DEC-006: Collaborative editor = Diwan.** Single binary, CRDT-native. Excluded from bisync. Auth disabled Phase 1.
- **DEC-007: Offline co-editing = Phase 4.** Diwan offline layer not ready upstream.
- **DEC-008: Revocation = short-lived tokens + revocation list.** 15-30 min TTL. No introspection-on-write Phase 1.
- **DEC-009: Selective sync = rclone --exclude filters + dashboard pre-signed fetch.** Full local hydration Phase 2 if needed.
- **DEC-010: Device security = encrypted cache + device registry + soft remote-wipe on startup.** No MDM dependency.
- **DEC-011: Code signing = unsigned Phase 1, MSIX Store Phase 4.** No certificate purchase.
- **DEC-012: POPIA = retention.json + audit logs sufficient Phase 1.** DPA deferred until external customers.
- **DEC-013: Windows-only Phase 1.** macOS Phase 3+, not current commitment.
- **DEC-014: Tenant model = single bucket, prefix-isolated.** `ums/orgs/{org-id}/departments/{dept-id}/...`. Branding at `ums/orgs/{org-id}/branding/manifest.json`.
- **DEC-015: Capability tokens carry org, dept, UI capabilities.** Schema includes `schema_version`. Issued by Autentico.
- **DEC-016: Dashboard = tab-isolated pipelines.** Each tab maps to one pipeline prefix. Schema isolation by prefix.
- **DEC-017: Audit trail = sidecar JSON on every write.** `ums/orgs/{org-id}/audit/{yyyy}/{mm}/{dd}/{ts}-{uid}-{op}.json`. Append-only.
- **DEC-018: Version restore = super-user only, logged as new version.** Restore writes new audit event.
- **DEC-019: Schema evolution = schema_version + migrate-on-read.** Applies to all config JSON.
- **DEC-020: Backup = S3 versioning + independent nightly snapshot to second provider.** Provider TBD at provisioning.
- **DEC-021: Shortcut repair = inside signed Tauri binary, Task Scheduler trigger.** NSIS installer creates shortcuts. `UMS.exe --repair-shortcuts` at logon + 07:00 daily.
- **DEC-022: Update = Tauri updater, sign-after-Authenticode.** `.sig` after Authenticode signing. Staged rollout + version heartbeat with org_id.
- **DEC-023: Git model = main protected, squash merges, stage branches.** See section 10.
- **DEC-024: Two doc sets.** `docs/` (in git) and `docs/dev/` (gitignored, real keys).
- **DEC-025: Handover = 12 fixed sections.** See section 10.
- **DEC-026: Fail-safe alignment = 4-signature verification.** See section 11.
- **DEC-027: Assets = source-first SVG.** See rule 41 and `docs/handover/00a-assets.md`.
- **DEC-028: Placeholder keys used in chat only.** Real keys in `docs/dev/DEV-GUIDE.md`. See section 13.

---

## 10. Documentation Structure, Handover Format, Git Model

### Directory layout

```
ums/
├── .gitignore
├── assets/
│   ├── source/                    (SVG sources - committed)
│   ├── generated/                 (build outputs - gitignored)
│   └── README.md
├── docs/
│   ├── README.md
│   ├── rules/RULES.md
│   ├── architecture/DECISIONS.md
│   ├── backlog/BACKLOG.md
│   ├── handover/
│   │   ├── 00-founding.md
│   │   ├── 00a-assets.md
│   │   ├── CURRENT.md
│   │   └── NN-stage-slug.md
│   └── dev/DEV-GUIDE.md           (gitignored - real keys here)
├── src-tauri/
│   └── icons/                     (committed - required at build time)
└── src/
    └── assets/
```

### Handover 12-section format

Every stage handover must contain, in this order:
1. Stage Metadata
2. Prior Handover Reference
3. Where the Project Started
4. Where the Project Is Now
5. What Was Done This Stage
6. Known Bugs Not Fixed
7. Current Workings
8. Next Steps
9. Decision Log
10. Dependency Inventory
11. Rollback Contract
12. Fail-Safe Alignment

### CURRENT.md format

Live state file, updated continuously, always reflects working tree not last commit. Contains: last handover reference, current branch, current work item, files being edited with signature status, last commit hash, blockers.

### Git model

- `main` protected, no direct pushes.
- Stage branches: `stage/NN-slug` (e.g. `stage/00-infrastructure`).
- Feature branches off stage branches: `feature/`, `fix/`, `chore/`, `docs/`.
- Squash merge to stage branch, squash merge stage to main.
- Commit format: `type(scope): subject` (e.g. `feat(sync): add bisync conflict detection`).

---

## 11. Fail-Safe Alignment Protocol

Before accepting any file content in chat, verify four signatures:

1. **SIG-1:** First line of file (path comment, rule 2).
2. **SIG-2:** Line count (`wc -l <path>`).
3. **SIG-3:** Last commit for file (`git log -1 --format="%h %s" -- <path>`).
4. **SIG-4:** First line and last line of file.

Rules: SIG-1 mismatch = STOP. SIG-2 differs >5% from handover = flag. SIG-3 older than handover merge = STOP. Only after all match, content is accepted.

---

## 12. Dependency Inventory

At founding, all dependencies are pending provisioning. Status table:

| Dependency | Version | Purpose | Status |
| :--- | :--- | :--- | :--- |
| Gozunga | - | Primary S3 storage | Pending - Stage 00 |
| Autentico | latest | IdP | Pending - Stage 00 |
| Resend | latest | Email | Pending - Stage 00 |
| Hetzner CX22 VPS | - | Autentico host | Pending - Stage 00 |
| Tauri | 2.x | Desktop shell | Pending - Stage 01 |
| React | 18.x | UI | Pending - Stage 01 |
| rclone | latest | bisync engine | Pending - Stage 02 |
| Diwan | latest | Collaborative editor | Pending - Phase 4 |
| Rust toolchain | stable | Compilation | Pending - Stage 01 |
| Node.js | 20 LTS | Build toolchain | Pending - Stage 01 |
| Inkscape | latest | SVG tooling | Active - installed Stage 00 |
| ImageMagick | latest | Image conversion | Active - installed Stage 00 |

---

## 13. Placeholder Key Conventions

All keys provided in chat are placeholders only. Real values stored in `docs/dev/DEV-GUIDE.md` (gitignored) and shared via secure channel (1Password / Bitwarden / encrypted file).

Expected placeholder shapes:

| Key | Placeholder pattern | Length check |
| :--- | :--- | :--- |
| `GOZUNGA_ACCESS_KEY` | `AKIAXXXXXXXXXXXXXXXX` | 20 chars, `AKIA` prefix |
| `GOZUNGA_SECRET_KEY` | 40-char base64-like string | 40 chars |
| `AUTENTICO_JWT_SECRET` | 32-64 char random string | 32-64 chars |
| `AUTENTICO_ADMIN_PASS` | Strong password pattern | 16+ chars, mixed |
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | `re_` prefix, ~36 chars |
| `VPS_SSH_KEY` | OpenSSH private key block | Multi-line |
| `MSIX_SIGNING_CERT` | (deferred to Phase 4) | - |

Validation: when real keys arrive, format is checked against this table. Mismatch = STOP and confirm before use.

---

## 14. DEV-GUIDE.md Structure (gitignored)

Location: `docs/dev/DEV-GUIDE.md`. Never committed. Naming convention for keys inside: `[SERVICE]_[KEY_TYPE]_[ENV]` (e.g. `GOZUNGA_ACCESS_KEY_PROD`).

Sections (in order):
1. Prerequisites (Windows version, Cursor version, git version)
2. Tool installation (Inkscape, ImageMagick, Node.js, Rust, Tauri CLI) - exact `winget` commands
3. Repository setup (`git clone`, branch checkout)
4. External service accounts (step-by-step signup for Gozunga, VPS provider, Resend)
5. Key storage (all real keys here, with acquisition notes)
6. Local dev environment (`.env` file locations, how to run the app)
7. Build and package (Tauri build commands, MSIX packaging steps Phase 4+)
8. Deployment (VPS setup for Autentico, bucket setup for Gozunga)
9. Troubleshooting (common issues, contact for escalation)
10. Rotation and revocation (how to rotate each key, who has authority)

Shared with new devs via secure channel only. Never emailed, never in chat, never committed.

---

## 15. Rollback Contract

This handover creates documentation only.

Rollback: `git reset --hard <commit-before-this-one>` and delete `docs/` directory tree. No external services touched. No data loss possible.

---

## 16. Fail-Safe Alignment

Files created by this handover (verify at first commit):

| Path | First line (SIG-1) | Approx lines |
| :--- | :--- | :--- |
| `docs/handover/00-founding.md` | `# Ubuveil Management System - Founding Handover` | this file |
| `docs/handover/00a-assets.md` | `# UMS Asset Specification - Companion to Founding Handover` | ~55 |
| `docs/handover/CURRENT.md` | `# CURRENT - Live State` | ~20 |
| `docs/rules/RULES.md` | `# Ubuveil Management System - 43 Absolute Rules (v2.0)` | ~220 |
| `docs/architecture/DECISIONS.md` | `# Architecture Decision Log` | ~200 |
| `docs/README.md` | `# UMS Documentation` | ~30 |
| `docs/backlog/BACKLOG.md` | `# Documentation Debt Register` | ~10 |
| `assets/README.md` | `# UMS Asset Inventory and Build Instructions` | ~60 |
| `assets/source/app/icon.svg` | `<svg xmlns=...` | ~8 |
| `assets/source/app/tray-icon.svg` | `<svg xmlns=...` | ~5 |
| `assets/source/branding/logo-primary.svg` | `<svg xmlns=...` | ~6 |
| `assets/source/branding/logo-dark.svg` | `<svg xmlns=...` | ~6 |
| `assets/source/avatar/default-avatar.svg` | `<svg xmlns=...` | ~5 |
| `assets/source/empty-states/no-files.svg` | `<svg xmlns=...` | ~7 |
| `.gitignore` | `# UMS gitignore` | ~16 |

---

**End of founding handover. All future handovers must reference this file by name and commit hash.**
````

---

## Stage 0 Kickoff — Phase 0.1 (Local Setup, No Keys Needed)

Execute these in Cursor's terminal. Nothing here needs placeholders or cloud accounts.

### Step 0.1.1 — Create folder structure

```powershell
cd "E:\Creative Cloud\Design\2026\atg\Dev\Ubuveil UMS"
mkdir docs\rules, docs\architecture, docs\backlog, docs\handover, docs\dev
mkdir assets\source\app, assets\source\branding, assets\source\empty-states
mkdir assets\source\errors, assets\source\onboarding
mkdir assets\source\icons\notifications, assets\source\icons\file-types, assets\source\icons\widgets
mkdir assets\source\avatar, assets\source\docs, assets\generated\installer
mkdir src-tauri\icons, src\assets
```

### Step 0.1.2 — Verify tools

```powershell
rsvg-convert --version
magick --version
git --version
```

All three must return version strings. If `rsvg-convert` fails, add `C:\Program Files\Inkscape\bin` to PATH (Inkscape installs it there), close and reopen the terminal.

### Step 0.1.3 — Save the files

You now have the complete `00-founding.md` above. Save it to `docs\handover\00-founding.md`.

I still owe you the remaining files. Reply with **"send the rest"** and I will deliver in the next turn, in one message, ready to save:
- `docs/rules/RULES.md` (43 rules v2.0, full text)
- `docs/architecture/DECISIONS.md` (28 entries, full text)
- `docs/README.md`
- `docs/backlog/BACKLOG.md`
- `docs/handover/CURRENT.md`
- `docs/handover/00a-assets.md`
- `assets/README.md`
- `.gitignore`
- All 6 starter SVG files

Once those are saved, `git init` → commit → push completes Phase 0.1. Then Phase 0.2 (cloud provisioning) starts and I will ask for your placeholder key shapes at that point.

Ready when you are. Say "send the rest" and I will deliver.