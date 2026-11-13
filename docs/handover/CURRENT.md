Path: docs/handover/CURRENT.md

**Last handover:** `04-stage-04-company-profile.md`
**Current branch:** `stage/02-installer-updates`
**Stage:** 04 - Company Profile & Role Strategy (closing)
**Current work item:** Stage 04 close-out. Modal dark-palette fix and workspace-logo feature complete in the working tree. Version 0.2.2 unbumped per instruction; bump deferred to first auth update.
**Files edited this stage session:** `CompanyProfile.tsx`, `AppShell.tsx`, `globals.css`, `AppShell.css`, `AddCompanyModal.tsx`, `FileLuSetupModal.tsx`, `HelpModal.tsx`, `SyncSetupModal.tsx`.
**Known issues logged:** `DOC-004` (Section 12 omissions), `DOC-005` (z-index), `DOC-006` (DEC-002 superseded marker), `DOC-007` (Section 12 SIG-3/SIG-4).
**Next stage:** 05a - Auth Foundation (pre-change discussion open, sign-off pending).
**Blockers:** Rule 15 sign-off on auth pre-change discussion; Autentico API shape unknown to the frontend yet.

## Rules for this file
- Updated continuously, not at stage boundaries.
- Reflects working tree state, not last commit.

Path: docs/handover/CURRENT.md

**Last handover:** `04-stage-04-company-profile.md`
**Current branch:** `stage/02-installer-updates`
**Current stage:** 05a - Auth Foundation (opening)
**Current work item:** Stage 05a pre-change discussion written (`docs/architecture/AUTH-DESIGN.md`). Awaiting sign-off before any code. Stage 04 modal fix, `globals.css` consolidation, and workspace-logo feature are complete in the working tree but unbumped (0.2.2).
**Files edited this stage session:** `docs/architecture/DECISIONS.md`, `docs/backlog/BACKLOG.md`, `docs/handover/CURRENT.md`, `docs/architecture/AUTH-DESIGN.md`, `docs/handover/04-stage-04-company-profile.md` (Section 12 backfill).
**Open blockers to code:**
- Sign-off on AUTH-DESIGN.md (rule 15)
- Autentico API contract (request/response shape, endpoints, JWT claim schema)
- Current `AuthContext.tsx` source (rule 32 - unread)
- Current router source (rule 32 - unread)
**Known issues logged:** DOC-004, DOC-005, DOC-006 (pending sign-off), DOC-007.
**Next action:** Sign-off on AUTH-DESIGN.md, then provide Autentico API contract + `AuthContext.tsx` + router file, then 05a code ships.

## Rules for this file
- Updated continuously, not at stage boundaries.
- Reflects working tree state, not last commit.