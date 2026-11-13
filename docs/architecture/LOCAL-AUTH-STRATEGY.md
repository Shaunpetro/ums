# UMS Local Authentication & Offboarding Strategy

Path: docs/architecture/LOCAL-AUTH-STRATEGY.md
Status: Active (Stage 05)
Supersedes: v2 (which had a startup-blocking validate), v1 (Planned Phase 4)
References: AUTHENTICO-API.md (contract), DEC-002 (superseded), DEC-041, DEC-048, DEC-057, DEC-058, AUTH-DESIGN.md
Rules: 15, 20
Last updated: 2026-11-13

---

## 1. Overview

Autentico is a LAN-hosted Go identity provider on a Windows PC. It exposes an HTTP API. The contract is defined in `docs/architecture/AUTHENTICO-API.md`.

- **Server OS:** Windows 10/11
- **Runtime:** Go binary, single executable, no external dependencies
- **Network:** LAN-only, `http://<lan-ip>:8080`. Not exposed to public internet.
- **Database:** SQLite, embedded, WAL mode
- **Client:** UMS Tauri app, on the same LAN
- **Keypair:** RS256 signing keys at `%PROGRAMDATA%\Autentico\keys\`, permissions locked to the service account
- **Repo:** `C:\ums-autentico` (separate from UMS). Own handover chain. Own release cadence.
- **Host:** the current Windows PC (Petro's machine). Uptime matters for new logins only, not for existing sessions.

## 2. Token Strategy

- **Algorithm:** RS256 JWT
- **TTL:** 30 days from issue
- **Sliding renewal:** refresh issues new JWT with fresh `iat`/`exp`. Old JWT remains valid until natural expiry.
- **Claim schema:** see `AUTHENTICO-API.md` section 5
- **Storage:** OS keyring only (DEC-041). Never `localStorage`, never files.
- **Local signature verification:** in 05a. RS256 public key pinned at UMS build time (embedded in binary as `autentico-public.pem`). Every local JWT check validates the signature before trusting the claims. Rejects forged tokens (loophole L2).
- **Re-authentication:** after JWT `exp` (30 days from last issue), user must log in again, which requires Autentico reachable.

## 3. Boot Sequence (offline-tolerant)

The core of the offline-trust strategy (DEC-058):

1. Read JWT from keyring. If absent, user must log in (needs Autentico).
2. **Verify RS256 signature** against pinned public key. Invalid = fail login.
3. **Local expiry check:** `exp > now`. Expired = user must log in (needs Autentico).
4. **Clock-tamper guard:** if `now_local - last_successful_validate_at > 30 days`, user must log in (needs Autentico). Mitigates L3 partially.
5. All checks pass: user is authenticated. Load `user_metadata`, compute capabilities.
6. **Best-effort background validate** fires. Success updates `sync_mode` and `last_successful_validate_at`. Failure (Autentico unreachable) is silent - user keeps working.

The critical consequence: existing users work offline for up to 30 days. Only new logins and expired-token users need Autentico.

## 4. Client Check Cadence

- **On boot:** local checks as above. Background validate best-effort.
- **While running:** `validate` every 6 hours.
- **On network reconnect:** `validate` immediately.
- **Manual:** user can trigger via Help > "Check session status".

Failed validate while running is silent. Suspension or revocation status, when returned, applies the protocol in section 5.

## 5. Offboarding (Staged Revocation)

Driven by `users.status` column in Autentico's SQLite DB.

### Phase 1: Active
- Bidirectional sync.

### Phase 2: Suspended (48-hour grace from `suspended_at`)

- **Server:** admin calls `POST /api/v1/admin/users/:id/suspend`. `users.status='suspended'`, `suspended_at=now()`. `validate` returns `{"status":"suspended","suspended_at":"..."}`.
- **Client:** `sync_mode` in Rust process memory = `upload_only`. Downloads blocked at watcher level.
- **48-hour clock:** measured from `suspended_at` server timestamp, not client detection. If a user does not launch UMS until 3 days after suspension, `validate` returns `revoked` immediately.
- **Quarantine strategy (loophole mitigation):** queued uploads are sorted by file mtime vs `suspended_at`:
  - `mtime < suspended_at` -> normal path `{org}/users/{user}/...`
  - `mtime >= suspended_at` -> quarantine path `{org}/suspended_uploads/{user}/{YYYY-MM-DD}/{filename}`
  - Downloads during blind window logged to `{org}/audit/downloads/` with timestamps.
- **Admin action required:** review quarantine path, promote legitimate work or delete. Not automatic.

### Phase 3: Revoked (frozen)

- **Server:** admin calls `POST /api/v1/admin/users/:id/revoke`, OR 48h elapsed since `suspended_at` (Autentico auto-transitions). `validate` returns `{"status":"revoked","revoked_at":"..."}`. `refresh` returns 403.
- **Client:** sync engine stops entirely. Watcher killed. S3 uploads blocked. Banner "Device Revoked - Contact Admin".
- **Recovery:** only via `POST /api/v1/admin/users/:id/reactivate`.

### Data structures
- `users.status` column: `active` / `suspended` / `revoked`
- `users.suspended_at`, `users.revoked_at`
- `revocation_log` table (append-only audit)
- `revoked_tokens` table (`jti` blacklist, TTL-evicted)
- No `revoked.json` file (v1 had this; superseded)

## 6. Implementation Checklist

### 05p - Autentico (C:\ums-autentico)
- [x] API contract (`AUTHENTICO-API.md`)
- [ ] Go binary, single executable
- [ ] `/login`, `/validate`, `/refresh`, `/logout`, `/public-key` endpoints
- [ ] `seed` CLI subcommand (creates 8 users)
- [ ] `user suspend|revoke|reactivate` CLI subcommands
- [ ] `hash-password` CLI subcommand
- [ ] Argon2id password hashing
- [ ] RS256 keypair generation and rotation
- [ ] SQLite schema and migrations
- [ ] Windows service wrapper (NSSM or `sc create`)
- [ ] Nightly SQLite backup
- [ ] README with install instructions

### 05a - Auth Foundation (UMS)
- [ ] `rbac.rs` role->capability mapping (DEC-057)
- [ ] `lib.rs` commands: `autentico_login`, `autentico_logout`, `autentico_validate`, `autentico_refresh`, `get_cached_jwt`, `is_jwt_expired`, `decode_user_from_jwt`
- [ ] RS256 signature verification in `lib.rs` using `jsonwebtoken` crate + pinned `autentico-public.pem`
- [ ] `AuthContext.tsx` replaced (offline-tolerant boot)
- [ ] `LoginScreen.tsx` replaced (username/password form)
- [ ] Keyring for JWT
- [ ] `App.tsx` handles `authState === 'loading'`
- [ ] `AppShell.tsx` `read:profile` gating, devops hidden
- [ ] `CompanyProfile.tsx` banking view gated by `admin:finance`
- [ ] Version 0.2.3

### 05b - Revocation (UMS)
- [ ] `check_revocation` and 6-hour loop
- [ ] `sync_mode` in Rust memory (not file)
- [ ] Quarantine path sorting by mtime
- [ ] Banner UI
- [ ] Version 0.2.4

### 05c - Hardening (backlog)
- [ ] Key rotation support (rebuild with new public key)
- [ ] Monotonic clock verification
- [ ] Remote cache wipe
- [ ] Password change flow
- [ ] Password reset flow

## 7. Known Accepted Risks (DEC-058)

1. **L1 sync_mode tampering** - mitigated by Rust memory state
2. **L3 clock manipulation** - partial mitigation via `last_successful_validate_at`; full requires server enforcement
3. **L5 shared S3 credentials** - operational mitigation by revoking FileLu on termination
4. **L6 suspension learned via validate only** - by design; 6h cadence limits to 6h worst-case detection delay
5. **L8 mtime forgeable** - quarantine is cooperative

Additional accepted risk:
- **HTTP on LAN** - passwords cross LAN plaintext. Trusted LAN. HTTPS is future.
- **Autentico single point of failure** for new logins. Mitigated by 30-day offline grace.
- **Cache wipe is manual** - physical access. Remote wipe is future work.

## 8. Change Log

- **v1 (2026-11):** Initial strategy. Gaps: no API contract, ambiguous revocation timing, undefined revoked.json, startup-only check, no password spec, no keypair spec.
- **v2 (2026-11-13):** Points to AUTHENTICO-API.md. Fixes revocation timing, cadence, replaces revoked.json. Adds password and keypair specs. Documents accepted risks.
- **v3 (2026-11-13):** Offline-tolerant boot sequence (RS256 verify + local exp + server_time guard). 6-hour cadence (was 30 min). Quarantine strategy for post-suspension uploads. Adds L1-L9 loophole mitigations per DEC-058.