# UMS - Stage 01 UI Shell Handover

**Stage:** 01
**Slug:** ui-shell
**Date:** 2026-10-30
**Author:** Petro Malamule (Petro@ATG)
**Git branch:** `stage/01-ui-shell`
**Rules version active:** 2.0
**Supersedes:** `00-founding.md` (for active development)

---

## 1. Stage Metadata

- **Project:** Ubuveil Management System (UMS)
- **Developer:** Petro Malamule
- **GitHub:** shaunpetro
- **Root folder:** `E:\Creative Cloud\Design\2026\atg\Dev\Ubuveil UMS`
- **Target platform (Phase 1):** Windows 10/11 only
- **Stack:** Tauri v2 (Rust) + React 18 (TypeScript) + Vite + Lucide Icons + React Router

---

## 2. Prior Handover Reference

- **Previous:** `00-founding.md` (establishing the architecture, rules, and asset framework).

---

## 3. Where the Project Started

Stage 00 was dedicated to setting up the documentation, choosing the stack (Tauri + React), fixing the asset pipeline, and starting the Oracle Cloud VPS script for the Autentico authentication server. 

---

## 4. Where the Project Is Now

The Tauri desktop application is successfully compiled and running natively. The entire UI shell is built using our warm-dark glassmorphism design tokens. We have fully implemented the routing and the 6 major pipeline views (Dashboard, Storage, Tenders, Invoices, Projects, Tasks) using mocked data. The Oracle VPS script is still looping in the background on the user's PC trying to catch a free ARM instance.

---

## 5. What Was Done This Stage

- `S01-T01`: Scaffolded the Tauri v2 + React (TypeScript) app inside the `ums-app` folder.
- `S01-T02`: Installed `react-router-dom` for routing and `lucide-react` for icons.
- `S01-T03`: Mapped the design tokens from `00a-assets.md` into `src/styles/globals.css`.
- `S01-T04`: Built the `AppShell` layout with the sidebar, topbar, dynamic search placeholders, and theme toggle.
- `S01-T05`: Built the `Dashboard` view with responsive widget grids.
- `S01-T06`: Built the `Storage` view with departments, sites, local sync status, and layout toggles.
- `S01-T07`: Built the `Tenders` view with a Master-Detail layout, compliance vaults, and timelines.
- `S01-T08`: Built the `Invoices` view with data tables and a working glassmorphism modal.
- `S01-T09`: Built the `Projects` view with a full-width Kanban board.
- `S01-T10`: Built the `Tasks` view with HubSpot-style lists and analytics charts.
- `S01-T11`: Added modern, floating pill-style scrollbars globally.

---

## 6. Known Bugs Not Fixed

- **None at the UI level.** The current views are using mocked data and are not yet connected to the backend.
- **Oracle VPS:** The `oci compute instance launch` script is still failing with "Out of host capacity". The VPS has not been provisioned yet, so Autentico cannot be deployed.

---

## 7. Current Workings

- **Open branches:** `stage/01-ui-shell` (to be created).
- **Uncommitted changes:** All new React components and CSS files.
- **Pending decisions:** The exact Rust crate structure for the S3 sync agent (AWS SDK vs. Rust `object_store`).

---

## 8. Next Steps

1. `S01-N01`: Initialize Git branch `stage/01-ui-shell` and commit all UI code.
2. `S01-N02`: Create the `src-tauri/src/s3.rs` module.
3. `S01-N03`: Implement the `aws-sdk-s3` client to connect to FileLu.
4. `S01-N04`: Write the Tauri command `list_files()` to fetch real objects from the `ums-prod` bucket.
5. `S01-N05`: Wire the React `Storage` view to `invoke('list_files')`.
6. `S01-N06`: Implement the local directory watcher (`notify` crate) for the `E:\UMS_Sync` folder.

---

## 9. Decision Log

- **DEC-031: Routing = React Router DOM.** Chosen over manual state-based view switching to allow deep linking and cleaner component separation.
- **DEC-032: Icons = Lucide React.** Chosen for clean, consistent SVG icons that match the glassmorphism aesthetic and work easily with React.
- **DEC-033: Styling = Vanilla CSS with Custom Properties.** Chosen over Tailwind or CSS-in-JS to maintain absolute control over the complex glassmorphism (`backdrop-filter`) and dynamic theme variables without build-step bloat.

---

## 10. Dependency Inventory

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| Tauri | 2.x | Desktop shell |
| React | 18.x | UI framework |
| React Router DOM | 6.x | Routing |
| Lucide React | 0.x | Icons |
| Vite | 5.x | Frontend build tool |
| AWS SDK for Rust | 1.x | S3 / FileLu connection (pending) |

---

## 11. Rollback Contract

To rollback this stage, run:
`git reset --hard 83d1ec7` (the last commit of Stage 00). 
This will remove the entire `ums-app` directory and revert the repository to the completion of the asset pipeline.

---

## 12. Fail-Safe Alignment

Files created and touched this stage:

| Path | Purpose |
| :--- | :--- |
| `ums-app/src/App.tsx` | Router setup |
| `ums-app/src/main.tsx` | React entry point |
| `ums-app/src/components/Layout/AppShell.tsx` | Global layout (Sidebar/Topbar) |
| `ums-app/src/components/Layout/AppShell.css` | Layout styling |
| `ums-app/src/pages/Dashboard.tsx` | Dashboard view |
| `ums-app/src/pages/Storage.tsx` | Storage view |
| `ums-app/src/pages/Tenders.tsx` | Tenders view |
| `ums-app/src/pages/Invoices.tsx` | Invoices view |
| `ums-app/src/pages/Projects.tsx` | Projects view |
| `ums-app/src/pages/Tasks.tsx` | Tasks view |
| `ums-app/src/styles/globals.css` | Design tokens and shared UI |
| `ums-app/src/types/index.ts` | TypeScript interfaces |