# UMS - Stage 04 Company Profile & Roles Handover

**Stage:** 04
**Slug:** company-profile-roles
**Date:** 2026-11-11
**Author:** Petro Malamule (Petro@ATG)
**Git branch:** `stage/02-installer-updates`
**Supersedes:** `03-stage-03-branding-tray.md`

## 1. Stage Metadata
- **Project:** Ubuveil Management System (UMS)
- **Developer:** Petro Malamule
- **Target platform (Phase 1):** Windows 10/11 only

## 2. Prior Handover Reference
- **Previous:** `03-stage-03-branding-tray.md`

## 3. Where the Project Started
Stage 03 delivered a fully branded, auto-updating desktop app with a robust 1-hour batch sync queue. Users logged in via hardcoded profiles and had a basic Tasks tab.

## 4. Where the Project Is Now
The app features a dynamic Company Profile modal storing company VAT, Banking, Address, and Compliance docs (S3 backed). The RBAC matrix has been expanded to reflect the VSC Mining hierarchy. Users can compose branded emails using company templates.

## 5. What Was Done This Stage
- `S04-T01`: Updated `AuthContext.tsx` with extended `MOCK_USERS` (emails, roles, capabilities).
- `S04-T02`: Created `CompanyProfile.tsx` modal with Tabs for Identity, Compliance, and Email Templates.
- `S04-T03`: Added `company_profile.json` schema and wired it to S3 via Rust.
- `S04-T04`: Updated `AppShell.tsx` to show the Company Profile button in the topbar.

## 6. Known Bugs Not Fixed
- **Autentico Integration:** Currently using `MOCK_USERS`. Autentico LAN server must be installed to replace this.

## 7. Current Workings
- **Branch:** `stage/02-installer-updates`
- **Version:** `0.1.11`

## 8. Next Steps
- `S04-N01`: Deploy Autentico to `C:\UMS`.
- `S04-N02`: Begin Calendar / Meeting integration.

## 9. Decision Log
- **DEC-054:** Company > Users Hierarchy.
- **DEC-055:** VSC Mining Role-Based Access Control (RBAC) Matrix.
- **DEC-056:** Email Template & Sending Strategy.

## 10. Dependency Inventory
- Same as Stage 03.

## 11. Rollback Contract
`git reset --hard app-v0.1.11`

## 12. Fail-Safe Alignment
| Path | First line (SIG-1) | Approx lines |
| :--- | :--- | :--- |
| `ums-app/src/context/AuthContext.tsx` | `// Path: ums-app/src/context/AuthContext.tsx` | 75 |
| `ums-app/src/components/Company/CompanyProfile.tsx` | `// Path: ums-app/src/components/Company/CompanyProfile.tsx` | 180 |



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
```

### A3: Stage 04 handover Section 12 addendum

Append to `04-stage-04-company-profile.md` Section 12:

```markdown
| Path | First line (SIG-1) | Approx lines |
| :--- | :--- | :--- |
| `ums-app/src/components/Company/CompanyProfile.tsx` | `// Path: ums-app/src/components/Company/CompanyProfile.tsx` | [verify] (was 180, now ~745) |
| `ums-app/src/components/Layout/AppShell.tsx` | `// Path: ums-app/src/components/Layout/AppShell.tsx` | [verify] |
| `ums-app/src/components/Layout/AppShell.css` | `/* Path: ums-app/src/components/Layout/AppShell.css */` | [verify] |
| `ums-app/src/styles/globals.css` | `/* Path: ums-app/src/styles/globals.css */` | [verify] |
| `ums-app/src/components/Company/AddCompanyModal.tsx` | `// Path: ums-app/src/components/Company/AddCompanyModal.tsx` | ~46 |
| `ums-app/src/components/Layout/FileLuSetupModal.tsx` | `// Path: ums-app/src/components/Layout/FileLuSetupModal.tsx` | ~157 |
| `ums-app/src/components/Layout/HelpModal.tsx` | `// Path: ums-app/src/components/Layout/HelpModal.tsx` | ~182 |
| `ums-app/src/components/Layout/SyncSetupModal.tsx` | `// Path: ums-app/src/components/Layout/SyncSetupModal.tsx` | ~71 |
```

Fill the `[verify]` cells:

```powershell
cd "E:\Creative Cloud\Design\2026\atg\Dev\Ubuveil UMS\ums-app"
$files = @(
  "src/components/Company/CompanyProfile.tsx",
  "src/components/Layout/AppShell.tsx",
  "src/components/Layout/AppShell.css",
  "src/styles/globals.css",
  "src/components/Company/AddCompanyModal.tsx",
  "src/components/Layout/FileLuSetupModal.tsx",
  "src/components/Layout/HelpModal.tsx",
  "src/components/Layout/SyncSetupModal.tsx"
)
foreach ($f in $files) {
  $lines = Get-Content $f
  "{0,-60} {1,4} lines  first={2}" -f $f, $lines.Count, $lines[0]
}
```

For SIG-3 (rule 39 compliance; DOC-007 tracks this being partial):

```powershell
foreach ($f in $files) { "{0,-60} {1}" -f $f, (git log -1 --format=%h -- $f) }
```

### A4: Version bump

Still 0.2.2. Per your earlier instruction, bump 0.2.2 -> 0.2.3 when auth lands.

### A5: Process items to resolve before Stage 05 starts

1. **Stage 04 close-out sequence** per rules 17, 23, 30: pass the 9-check test gate, write final handover, squash Stage 04 to `main`, then open Stage 05 branch. The current branch name `stage/02-installer-updates` is a Stage 02 name but carries Stage 04 work. Rule 12 says stages have their own branches. Clean this when you open Stage 05, or accept the inconsistency and continue on the existing branch.

2. **DEC-002 superseded marker** - see `DOC-006`. Rule 20 requires stage-boundary timing for this edit. The Stage 05 kickoff is the boundary.

3. **CSP** - `tauri.conf.json` has `csp: null`. That is important for auth. Plain HTTP to a LAN Autentico will work with CSP null. If CSP is tightened later, a Caddy proxy per `LOCAL-AUTH-STRATEGY.md` step 5 becomes necessary. No action now; just noting it is why auth is feasible without an HTTPS proxy today.

---

## Part B: Auth pre-change discussion (rule 15)

This is the "dive into user auth". Code cannot ship until you sign off on scope, stage structure, and the DEC impact.

### B1: Decisions touched

- **DEC-002** (locked): Authentication = Autentico. Not being changed. Being implemented.
- **DEC-048** (locked): Local On-Premise Auth & Staged Revocation. Being implemented.
- **DEC-041** (locked): Runtime secret delivery via OS keyring. JWT will follow this pattern.
- **DEC-015** (locked): Capability tokens carry org, dept, UI capabilities. Autentico JWT must map to this shape (or the frontend must translate).

No decision is being reversed. This is the first implementation of the locked decisions.

### B2: Proposed stage structure

Rule 11: one stage, one deliverable. Rule 30: no parallel stages. Rule 15: lighter sign-off per stage. Given auth's blast radius, I recommend **three stages, not one**:

| Stage | Deliverable | Ships |
| :--- | :--- | :--- |
| **05a - Auth Foundation** | Login, logout, JWT refresh, Autentico integration, keyring storage, login gate | ~0.2.3 |
| **05b - Auth Revocation** | `check_revocation`, `sync_mode.json`, watcher upload-only guard, staged shutdown (Active -> Upload-Only -> Frozen), revoked UI | ~0.2.4 |
| **05c - Auth Offline** | 30-day JWT offline verification, graceful degradation, re-authentication flow, edge cases | ~0.2.5 |

Rationale:

- **05a** is testable end-to-end against a live Autentico. Ship it and you have working auth. If Autentico itself is unstable, this is the smallest possible failure surface.
- **05b** has security implications (data theft prevention on offboarding). It needs its own test gate. Mixing it with 05a invites review fatigue on the revocation protocol.
- **05c** is subtle and benefits from 05a/05b being stable first. The 30-day offline window is the least-used path and the easiest to regress.

Alternative: single Stage 05 doing all of a/b/c. Rejected because:
- Rollback granularity drops to "all or nothing"
- Rule 15 sign-off becomes a single massive proposal instead of three clear ones
- The "one deliverable per stage" spirit of rule 11 is diluted

If you prefer a single Stage 05, say so and I will consolidate. Otherwise default to 05a/05b/05c.

### B3: 05a proposed scope

**Backend (`lib.rs`), four new commands:**

1. `autentico_login(username: String, password: String) -> Result<AuthResponse, String>`
   - `POST {AUTENTICO_URL}/api/login` with username/password JSON
   - On success: extract JWT, `set_credential("autentico_jwt", token)`, return `{ token, user }` where user is `{ name, email, role, org, orgs, dept, path, capabilities }`
   - On failure: return mapped error (bad credentials, unreachable, server error)

2. `autentico_logout() -> Result<(), String>`
   - `delete_credential("autentico_jwt")`
   - Also call `POST {AUTENTICO_URL}/api/logout` best-effort (ignore network errors)

3. `autentico_validate() -> Result<bool, String>`
   - Read JWT from keyring
   - `POST {AUTENTICO_URL}/api/validate` with token
   - Return true if 200, false if 401, Err if network unreachable
   - Used on mount to auto-restore session

4. `autentico_refresh() -> Result<AuthResponse, String>`
   - Read JWT, call `POST {AUTENTICO_URL}/api/refresh`
   - On success, update keyring with new token, return user
   - On failure (token expired, revocation), return specific error so frontend can distinguish

**Frontend (`AuthContext.tsx`), full replacement:**

- Remove `MOCK_USERS` array
- `login(username, password)` calls `autentico_login`, sets user state
- `logout()` calls `autentico_logout`, clears user state
- On mount: `autentico_validate()`; if true, `autentico_refresh()`; set user
- On mount: if `validate` returns false, clear keyring and stay on login screen
- On mount: if `validate` errors (network), show "offline" login option if a token exists (soft offline grace until 05c)
- All existing user shape (`{ id, name, email, role, org, orgs, dept, path, capabilities }`) preserved. `capabilities` maps from Autentico's role claims per DEC-055.

**Frontend (`LoginScreen.tsx`), new file:**

- Username field, password field, "Sign In" button
- Error display region (bad creds, LAN unreachable, API error)
- "Use previous session" button only shows if a JWT exists in keyring and validate failed due to network (soft offline path)
- Retry button

**Frontend routing (`App.tsx` or router):**

- Wrap authenticated routes in `<RequireAuth>` that redirects to `/login` if no user
- `/login` renders `LoginScreen` (never inside AppShell)

**Ops (out of code scope, from S04-N01 / DEC-048):**

- Autentico binary at `C:\UMS` on the LAN PC or Raspberry Pi
- SQLite DB initialized with the 8 VSC Mining users per DEC-055
- LAN IP documented in DEV-GUIDE
- `.env` entry: `UMS_AUTENTICO_URL=http://192.168.x.x:8080`

**Test gate for 05a:**

1. Build succeeds
2. `npx tsc --noEmit` clean
3. Login with valid creds -> sets user, shows AppShell
4. Login with invalid creds -> error toast, stays on login
5. Login with LAN unreachable -> error toast, stays on login
6. Logout -> clears keyring, redirects to login
7. App restart -> auto-restores via keyring + refresh
8. Restart with expired JWT -> redirects to login
9. No secrets in repo (Autentico URL from `.env`, JWT in keyring only)
10. Handover complete with Section 12 listing every touched file
11. `CURRENT.md` updated

**Rollback contract:**

`git reset --hard app-v0.2.2` returns to pre-auth state. Additionally, before starting 05a, tag `pre-auth-mock-users` at current HEAD so `MOCK_USERS` can be restored if Autentico turns out to be infeasible mid-stage.

### B4: Assumptions to verify before 05a code

These are rule 22 pre-stage items. I need answers before shipping code.

1. **Autentico API shape.** I have never seen Autentico's endpoints. Need: a sample request/response, or Autentico docs, or at least confirmation of the path convention (`/api/login` vs `/auth/login` vs other) and the response JSON shape.
2. **Autentico role mapping.** DEC-055 lists 8 users with department-level RW/R matrix. Autentico must return a JWT whose claims can be translated to the frontend's `capabilities` array. Need: a sample claim payload, or confirmation that `capabilities` will be hardcoded in Autentico's SQLite during provisioning (one row per user with their capability list).
3. **`AuthContext.tsx` current content.** I have never read this file. Rule 32 blocks replacing it without reading. Need: full paste.
4. **Router file.** `App.tsx` or wherever `<Routes>` lives. Need: full paste, to know where to gate.
5. **`DEV-GUIDE.md` Autentico section.** Current version says "Deferred to Phase 4". Need: whether there is now an Autentico URL or a plan for one, or confirmation that I write that section as part of 05a.

### B5: Sign-off request

Please confirm:

1. **Scope:** three stages (05a/05b/05c) or single Stage 05?
2. **05a scope as above:** yes / adjust
3. **DEC edits at stage boundary:** mark DEC-002 SUPERSEDED with reference to DEC-048, per DOC-006. Rule 20 requires stage-boundary timing; 05a kickoff is the boundary.
4. **Version bump:** 0.2.2 -> 0.2.3 on 05a merge
5. **Section 12 policy for Stage 05:** SIG-1 through SIG-4 (rule 39 full compliance) from the start, or continue SIG-1/SIG-2 as Stage 04 did? Recommend full compliance so the handover is usable for post-merge verification.

---

## Part C: What I need to start 05a code

Minimum set to ship 05a in one pass next turn:

1. **Sign-off** on B5 above
2. **Autentico API details** (B4 items 1 and 2)
3. **Current `AuthContext.tsx`** full content (B4 item 3)
4. **Router file** full content (B4 item 4)
5. **Current `BACKLOG.md`** if you want full-file replacement rather than manual append
6. **Confirmation** that `CURRENT.md` has not drifted since my earlier paste

With those in hand, the 05a ship will be:
- Full replacement: `lib.rs` (+4 commands, ~80 lines added)
- Full replacement: `AuthContext.tsx` (MOCK_USERS removed, Autentico-driven)
- New file: `LoginScreen.tsx`
- Patch: router file (login gate)
- Append: `globals.css` (login screen styles, if needed)
- New file: `docs/handover/05a-auth-foundation.md` at close
- Update: `CURRENT.md` at close
- Version bump: `tauri.conf.json`, `Cargo.toml`, `package.json`

No auth code ships until sign-off and the files above. That is rule 15 and rule 32, and it is exactly where I intend to be most careful given how this session has gone.