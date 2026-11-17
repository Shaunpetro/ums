
# Stage 06 Pre-Change Discussion: Calendar & Auth Hardening

Path: docs/architecture/CALENDAR-DESIGN.md
Status: Approved (Signed off 2026-11-16)
Author: Petro Malamule (Petro@ATG)
Rules: 15, 20

---

## 1. Context

Stage 05b successfully implemented the 3-phase Auth Revocation protocol. The Auth foundation is 90% complete. 

For Stage 06, we are combining two scopes to save a release cycle:
1. **Auth Hardening (05c):** Finalize the offline grace period and key rotation.
2. **Calendar & Meetings (Stage 06):** Build the first new business feature since the Company Profile.

**Multi-Org Tenancy** is deferred to Phase 2 and logged as `DOC-014`. It is not architectural debt; the backend already supports it.

## 2. Scope 1: Auth Hardening (05c)

1. **Key Rotation Support:**
   At boot/login, the client will fetch the latest public key from `GET /api/v1/public-key`. It will cache this locally. The embedded `autentico-public.pem` becomes a fallback if the network is down.
2. **Offline Mode State:**
   `AuthContext` tracks `isOffline: boolean`. If `validate` fails due to a network error, `isOffline` becomes `true`. `AppShell` shows a blue info banner: "Operating Offline. Last verified {date}."
3. **Monotonic Clock (Skipped):**
   DEC-058 accepted the risk that a user could roll back their Windows clock. Mitigation requires hardware TPM, which is out of scope.

## 3. Scope 2: Calendar & Meetings

### 3.1 Storage Model
The Calendar is a single JSON file per organization, synced via the existing S3 batch sync engine.
**Storage Path:** `{org_id}/shared/calendar/events.json`

**JSON Schema:**
```json
{
  "schema_version": 1,
  "events": [
    {
      "id": "evt-uuid",
      "title": "Board Meeting",
      "description": "Q4 Financial Review",
      "start_time": "2026-11-20T09:00:00Z",
      "end_time": "2026-11-20T11:00:00Z",
      "all_day": false,
      "location": "Main Boardroom",
      "dept": "Executive",
      "created_by": "shadrack",
      "attendees": ["petro", "marshall", "hector"],
      "recurrence": null
    }
  ]
}
```

### 3.2 UI Implementation & Branding
- **Library:** FullCalendar Standard (MIT). 
- **Brand Conformance:** All FullCalendar CSS variables will be mapped to our tokens (e.g., `.fc-event` uses `var(--ubv-brand-gradient)`, backgrounds use `var(--ubv-bg-elevated)`).
- **Department Colors:** Events are color-coded by `dept`. Executive = brand gradient, Finance = `--ubv-success`, HR = `--ubv-warning`, Management = `#4a3b6b`, DevOps = `#6ee7a0`.
- **Routing:** New route `/calendar`. Sidebar nav item `Calendar`.
- **Views:** Month, Week, List.
- **Filters:** Top bar filter for "All / My Events / [Department]".

### 3.3 Team Members (Dynamic)
- We add a new endpoint to Autentico: `GET /api/v1/admin/users`.
- Returns an array of `{ id, username, name, email, dept, role }`.
- UMS fetches this on boot, caches it in React Context, and uses it to populate the Attendee multi-select.
- Attendees are stored in the event JSON as `user_id` (UUID). Names are resolved at render time.

### 3.4 Edit Permissions (The "Clumsy" Rule)
To prevent accidental drag-and-drop chaos, permissions are strictly enforced based on roles.

| Action | Who can do it? |
| :--- | :--- |
| **Create Event** | Anyone with `write:calendar`. `created_by` is set automatically. |
| **Edit / Drag / Delete** | Only if: `created_by === user.id` OR `user.role` in `['super_admin', 'devops_admin']` (Super Users) OR `user.role` in `['pm', 'technical_manager', 'pa']` (Management & Palesa). |
| **View Event** | Everyone with `read:calendar`. |

*Note: Marshall (Finance) and Thapelo (HR) can create and edit their OWN events, but cannot move Hector's Project kickoff or Shadrack's Board Meeting.*

### 3.5 Drag & Drop
- Enabled if the user has Edit permission for that specific event. FullCalendar is passed `editable: true` per event.
- Dragging triggers an optimistic local update and a `write_calendar` sync to S3.

### 3.6 Export
- A "Download .ics" button on the Event Details modal. Uses the MIT-licensed `ics` npm package to generate standard calendar files for phone/Outlook.

## 4. Rollback Contract

| Stage | Pre-tag | Revert |
| :--- | :--- | :--- |
| 06 | `app-v0.2.5` | `git reset --hard app-v0.2.5` |

---
*Signed: Shaunpetro     Date: 2026-11-16*
```

---

### The Roadmap to Complete Stage 06

Since this is a larger stage, we will break the coding into three distinct turns:

**Turn 1: Autentico & Rust Backend**
- Add `GET /api/v1/admin/users` to the Go server.
- Add `read_calendar` and `write_calendar` commands to `lib.rs`.
- Add `read:calendar` and `write:calendar` to `rbac.rs`.

**Turn 2: Auth Hardening (05c)**
- Update `lib.rs` to fetch the public key on boot.
- Add `isOffline` to `AuthContext.tsx` and the blue banner to `AppShell.tsx`.

**Turn 3: Calendar Frontend**
- Install `@fullcalendar/react` and `ics`.
- Build `Calendar.tsx` and `CreateEventModal.tsx`.
- Style it to match the brand.

If you are happy with the design doc, we will start with **Turn 1 (Backend)** right now. Just say "Go" and I'll drop the Autentico and Rust code.