# Documentation Debt Register

Path: docs/backlog/BACKLOG.md
Rule: 18

All TODOs, deferred items, and known gaps live here. Never in code comments. Each entry has ID, description, blocking-status, owner.

---

## Format

`[ID] - [description] - [blocking: yes/no] - [owner] - [date added]`

---

## Open items

None yet.

---

## Resolved items

None yet.

### DOC-004: Handover Section 12 omissions for shared infrastructure

- **Description:** Stage 04 handover Section 12 lists only `AuthContext.tsx` and `CompanyProfile.tsx`. Missing from Section 12: `AppShell.tsx` (touched per Section 5 S04-T04) and `ums-app/src/styles/globals.css`, which every component imports and which defines all `--ubv-*` tokens plus `.glass-panel`, `.modal-overlay`, `.modal-content`, `.modal-header`, `.modal-title`, `.modal-close`, `.form-group`, `.form-input`, `.action-btn`, `.outline-btn`, `.text-btn`, `.badge`, `.marker`, `.flex-between`, `.spin`. `globals.css` has been missing from every handover going back to Stage 01. Stage 04's SIG-2 for `CompanyProfile.tsx` is stale (180 declared vs ~745 actual). Every `*Modal*.tsx` file also missing from Section 12: `AddCompanyModal.tsx`, `FileLuSetupModal.tsx`, `FileViewerModal.tsx`, `HelpModal.tsx`, `SyncSetupModal.tsx`.
- **Blocking:** yes - any future modal, token, or theme work will repeat the bug class fixed in this pass until base stylesheet and modal files are documented.
- **Owner:** Petro@ATG

### DOC-005: Modal z-index inconsistency

- **Description:** `SyncSetupModal.tsx` uses `zIndex: 9999` on its overlay. All other modals (`AddCompanyModal`, `CompanyProfile`, `FileLuSetupModal`, `HelpModal`, `FileViewerModal`) use `zIndex: 99999`. Today they do not render concurrently so the difference is invisible, but any future flow that opens one on top of another (for example, a help prompt from the sync setup screen) will render below it. Consolidate to a single token (proposed: `--ubv-z-modal` in `globals.css` set to `99999`, or a `.modal-overlay` rule that sets z-index and drops the inline override everywhere) at a stage boundary.
- **Blocking:** no
- **Owner:** Petro@ATG

### DOC-004: Handover Section 12 omissions for shared infrastructure

- Description: Stage 04 handover Section 12 lists only `AuthContext.tsx` and `CompanyProfile.tsx`. Missing: `AppShell.tsx` (touched per Section 5 S04-T04), `AppShell.css`, and `ums-app/src/styles/globals.css`, which every component imports and which defines all `--ubv-*` tokens plus `.glass-panel`, `.modal-overlay`, `.modal-content`, `.modal-header`, `.modal-title`, `.modal-close`, `.form-group`, `.form-input`, `.action-btn`, `.outline-btn`, `.text-btn`, `.badge`, `.marker`, `.flex-between`, `.spin`. `globals.css` has been missing from every handover going back to Stage 01. Stage 04's SIG-2 for `CompanyProfile.tsx` is stale (declared 180, actual ~745). Every `*Modal*.tsx` file was also missing from Section 12.
- Blocking: yes - any future modal, token, or theme work will repeat the bug class fixed this session until the base stylesheet and modal files are in Section 12.
- Owner: Petro@ATG

### DOC-005: Modal z-index inconsistency

- Description: `SyncSetupModal.tsx` uses `zIndex: 9999` on its overlay. All other modals use `zIndex: 99999`. Currently invisible (modals do not render concurrently), but any future stacked-modal flow (help prompt from sync setup, for example) will render below. Consolidate to a shared rule on `.modal-overlay` at a stage boundary; drop the inline override everywhere.
- Blocking: no
- Owner: Petro@ATG

### DOC-006: DEC log inconsistency on Autentico

- Description: DEC-002 ("Authentication = Autentico") is not marked SUPERSEDED, but `docs/architecture/LOCAL-AUTH-STRATEGY.md` states it supersedes DEC-002's cloud-VPS aspect, and DEC-048 ("Local On-Premise Auth & Staged Revocation") is the operative locked decision. DEC-002 should be marked SUPERSEDED with a reference to DEC-048 and LOCAL-AUTH-STRATEGY.md. This is a DEC log edit (rule 20 stage-boundary change), needs sign-off.
- Blocking: yes for Stage 05 kickoff, so the auth work references the right decisions without ambiguity.
- Owner: Shaunpetro (sign-off) + Petro@ATG (edit)

### DOC-007: Stage 04 Section 12 format is partial

- Description: Rule 39 requires SIG-1 through SIG-4 on every Section 12 entry. Existing handovers use SIG-1 and SIG-2 only. Not urgent, but handovers cannot be used for post-merge file-identity verification per rule 39's intent until SIG-3 (last commit) and SIG-4 (first + last line) are populated. Fix when Section 12 is backfilled in A3.
- Blocking: no
- Owner: Petro@ATG

### DOC-004: Handover Section 12 omissions for shared infrastructure

- **Description:** Stage 04 handover Section 12 lists only `AuthContext.tsx` and `CompanyProfile.tsx`. Missing: `AppShell.tsx` (touched per Section 5 S04-T04), `AppShell.css`, and `ums-app/src/styles/globals.css` - which every component imports and which defines all `--ubv-*` tokens plus `.glass-panel`, `.modal-overlay`, `.modal-content`, `.modal-header`, `.modal-title`, `.modal-close`, `.form-group`, `.form-input`, `.action-btn`, `.outline-btn`, `.text-btn`, `.badge`, `.marker`, `.flex-between`, `.spin`. `globals.css` has been missing from every handover back to Stage 01. Stage 04's SIG-2 for `CompanyProfile.tsx` is stale (declared 180, actual ~745). Every `*Modal*.tsx` file was also missing from Section 12.
- **Blocking:** yes - any future modal, token, or theme work will repeat the bug class fixed this session until the base stylesheet and modal files are in Section 12.
- **Owner:** Petro@ATG

### DOC-005: Modal z-index inconsistency

- **Description:** `SyncSetupModal.tsx` uses `zIndex: 9999` on its overlay. All other modals use `zIndex: 99999`. Currently invisible (modals do not render concurrently), but any future stacked-modal flow (a help prompt from the sync setup screen, for example) will render below. Consolidate to a shared rule on `.modal-overlay` at a stage boundary; drop the inline override everywhere.
- **Blocking:** no
- **Owner:** Petro@ATG

### DOC-006: DEC-002 superseded marker

- **Description:** DEC-002 ("Authentication = Autentico") was never marked SUPERSEDED, though `docs/architecture/LOCAL-AUTH-STRATEGY.md` and DEC-048 both superseded its cloud-VPS aspect. Marker appended to `docs/architecture/DECISIONS.md` at Stage 05a kickoff (2026-11-13). Pending sign-off.
- **Blocking:** no - marker shipped, only sign-off remains
- **Owner:** Shaunpetro

### DOC-007: Stage 04 Section 12 SIG-3/SIG-4 partial

- **Description:** Rule 39 requires SIG-1 through SIG-4 on every Section 12 entry. Existing handovers use SIG-1 and SIG-2 only. The Section 12 backfill (A3 of this turn) ships with SIG-1, SIG-2, SIG-3. SIG-4 (first + last line) can be added on next touch of each file. Not urgent, but handovers are not usable for post-merge file-identity verification until SIG-4 is populated.
- **Blocking:** no
- **Owner:** Petro@ATG

### DOC-009: Rotate Autentico dev credentials at 05a close

- **Description:** During 05a development, bootstrap token and 8 seed passwords (`users.json` seeded output) are committed to local `.env` and passed in chat. These are development placeholders, not production credentials. Before deploying Autentico to non-Petro users (Stage 05b close or earlier if rollout starts), rotate: (a) `AUTENTICO_ADMIN_TOKEN`, (b) `AUTENTICO_BOOTSTRAP_TOKEN`, (c) all 8 user passwords via `autentico hash-password` + manual `UPDATE users SET password_hash=...` in SQLite, (d) regenerate RS256 keypair at `C:\ProgramData\Autentico\keys\` and update `autentico-public.pem` in UMS repo. Document rotation in the offboarding runbook.
- **Blocking:** no for 05a dev, **yes** for any rollout beyond Petro's PC
- **Owner:** Petro@ATG

### DOC-009: Rotate Autentico dev credentials at 05a close

- **Description:** During 05a development, bootstrap token and 8 seed passwords are development placeholders. Before deploying Autentico to non-Petro users (Stage 05b close or earlier), rotate: (a) `AUTENTICO_ADMIN_TOKEN`, (b) `AUTENTICO_BOOTSTRAP_TOKEN`, (c) all 8 user passwords via `autentico hash-password` + `UPDATE users SET password_hash=...` in SQLite, (d) regenerate RS256 keypair at `C:\ProgramData\Autentico\keys\` and update `src-tauri/keys/autentico-public.pem` in UMS. UMS must rebuild after keypair rotation (public key is embedded via `include_str!`).
- **Blocking:** no for 05a dev, **yes** for any rollout beyond Petro's PC
- **Owner:** Petro@ATG

### DOC-010: Autentico code quality cleanups

- **Description:** `handlers.go` has unused `AdminToken` field on the `Handlers` struct and a `jsonUnmarshal`/`jsonUnmarshalImpl` wrapper that should be inlined. Neither breaks the build. Clean up before Autentico v0.1.0 public release. Also: UMS `lib.rs` adds a `reqwest` dependency. Verify no version conflict with the `tauri-plugin-updater` transitive reqwest before the 05a merge; align if necessary.
- **Blocking:** no
- **Owner:** Petro@ATG