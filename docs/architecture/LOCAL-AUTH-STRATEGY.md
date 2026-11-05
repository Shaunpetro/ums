# UMS Local Authentication & Offboarding Strategy

Path: docs/architecture/LOCAL-AUTH-STRATEGY.md
Status: Planned (Phase 4)
Supersedes: DEC-002 (Autentico Cloud VPS)

---

## 1. Architecture Overview

To avoid cloud hosting costs and Oracle capacity issues, the Autentico Identity Provider (IdP) will be hosted **on-premise** on a local LAN machine (Windows PC or Raspberry Pi).

- **Server OS:** Windows 10/11 or Linux (ARM)
- **Runtime:** Autentico Go binary running as a background service (NSSM on Windows).
- **Network:** LAN-only (e.g., `http://192.168.1.50:8080`). Not exposed to the public internet.
- **Database:** SQLite (embedded, no separate DB server).
- **Client Auth:** Tauri app points to the LAN IP. 

## 2. Token Strategy (The "30-Day Magic Trick")

Because the server is not always-on (due to power outages) and not exposed to the internet, users cannot authenticate remotely.

- **Access Tokens:** RS256 JWT with a **30-day TTL**.
- **Offline Work:** Once a user logs in while on the office LAN, the app caches the JWT in the OS keyring.
- **Graceful Degradation:** For the next 30 days, the app can verify the JWT locally. Users can open the app, browse files, and sync with FileLu **even if the local auth server is turned off or the user is working from home**.
- **Re-authentication:** After 30 days, the app requires a login, which means the user must be on the office LAN.

## 3. Staged Revocation Protocol (Offboarding)

When an admin suspends a user in the Autentico dashboard, the server updates the revocation list (`revoked.json`). The desktop app checks this list upon startup.

If the app detects a revoked/suspended token, it follows a 3-phase shutdown to prevent data theft while preserving their last work:

### Phase 1: Active (Normal)
- **Direction:** Bidirectional (Local <-> Cloud).
- **Behavior:** User can upload, download, and modify files.

### Phase 2: Suspended (Grace Period - 48 Hours)
- **Direction:** One-way (Local -> Cloud only).
- **Behavior:** The sync engine ignores `download` events from the cloud. If the user creates or modifies a local file, it is uploaded to FileLu. This prevents the user from downloading new company files, but saves their last 48 hours of work. 
- **Trigger:** App startup + LAN connection where the server says `status: suspended`.

### Phase 3: Revoked (Frozen - Day 3+)
- **Direction:** None.
- **Behavior:** The sync engine stops entirely. Local files are frozen. The app displays a "Device Revoked" warning and requires the IT admin to wipe the cache (DEC-010) or manually unlock the device.
- **Trigger:** 48 hours after the suspended status is detected, OR immediate detection if the token is expired.

## 4. Implementation Checklist (For Phase 4)
- [ ] Replace `MOCK_USERS` in `AuthContext.tsx` with real Autentico API calls.
- [ ] Update Rust `lib.rs` watcher to read a local `sync_mode.json` flag (`active` | `upload_only` | `disabled`).
- [ ] Modify `handle_watcher_event` in Rust to skip downloads if `sync_mode == upload_only`.
- [ ] Add the `check_revocation` command to the Tauri backend.
- [ ] Configure a local Caddy proxy for HTTPS if Tauri strict CSP blocks HTTP requests to the LAN IP.