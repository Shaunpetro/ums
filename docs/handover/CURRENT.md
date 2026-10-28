# CURRENT - Live State

Path: docs/handover/CURRENT.md

**Last handover:** 00-founding.md (see git log for commit hash)
**Current branch:** `stage/00-infrastructure`
**Stage:** 00 - Infrastructure (Phase 0.1 complete, Phase 0.2 pending)
**Current work item:** S00-N04 - awaiting placeholder key shapes from user
**Files being edited:** none (all Phase 0.1 files committed, asset pipeline verified)
**Last commit:** `83d1ec7` - harden render script against inkscape 1.4 cli race, add tray-32
**Blockers:** Phase 0.2 cloud provisioning blocked on placeholder key shapes

---

## Phase 0.1 status (complete)

- Folder structure created.
- 14 initial docs + assets committed.
- Brand palette corrected to official Adobe Illustrator palette (coral/peach).
- Logo SVGs committed (5 branding + 2 app).
- Stale placeholder SVGs removed.
- Render pipeline operational (`assets/render.ps1` uses Inkscape native CLI).
- All 8 exports verified: icon, tray-16, tray-32, favicon, 2 horizontal wordmarks, 2 vertical marks.

## Phase 0.2 status (blocked)

Awaiting placeholder key shapes from user (founding handover section 13):

- `GOZUNGA_ACCESS_KEY`
- `GOZUNGA_SECRET_KEY`
- `AUTENTICO_JWT_SECRET`
- `AUTENTICO_ADMIN_PASS`
- `RESEND_API_KEY`
- `VPS_SSH_KEY`

Placeholder values only. Real values will live in `docs/dev/DEV-GUIDE.md` (gitignored).

## Rules for this file

- Updated continuously, not at stage boundaries.
- Reflects working tree state, not last commit.
- If lost, the last handover plus `git status` reconstructs everything.
- Do not put real keys, real secrets, or PII here.