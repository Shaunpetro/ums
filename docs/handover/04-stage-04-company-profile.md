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