# Ubuveil Management System - 43 Absolute Rules (v2.0)

Path: docs/rules/RULES.md
Version: 2.0
Effective: 2026-10-28
Author: Petro Malamule (Petro@ATG)

These rules are non-negotiable. Violating them breaks the production build and causes architectural collapse. Rules are versioned and may only be changed at stage boundaries (rule 20). Changes require Pre-Change Discussion (rule 15) and sign-off by Shaunpetro.

---

## Core Engineering (1-10)

1. **Full file replacements only.** Ship the entire new file. No diffs, no partial edits, no `/* ... same as before ... */` comments. The production server has no version control.

2. **Path comment at the top of every source file.** First line of every file states its repo-relative path and, for code files, its purpose.

3. **Build step is required, artifacts are not committed.** Tauri and React require `cargo build` and `npm run build`. Build outputs (`dist/`, `target/`, `node_modules/`) never enter the repo. The only exception is `src-tauri/icons/` which Tauri requires at build time and is generated from `assets/source/app/icon.svg` per rule 41.

4. **No secrets in the repo.** All keys, tokens, and credentials live in `docs/dev/DEV-GUIDE.md` (gitignored). Placeholder keys may appear in chat for shape validation only.

5. **Language-appropriate standards.** Rust: `cargo fmt` + `cargo clippy -- -D warnings`. TypeScript: ESLint + Prettier, strict mode enabled. All CI runs these on every PR.

6. **Translation-ready strings.** All user-facing strings in React use i18next keys via `t()`. No hardcoded English strings in JSX.

7. **Escape everything.** React JSX auto-escapes. Never use `dangerouslySetInnerHTML` without DOMPurify. Rust SQL uses parameterized queries only (`sqlx`). All S3 object keys validated against a regex before any write.

8. **Prefix everything.** CSS classes: `ubv-`. React components: `Ums*` (PascalCase). Rust modules and functions: `ums_` (snake_case). S3 paths: `ums/`. Environment variables: `UMS_` for app config, `[SERVICE]_` for credentials.

9. **No em-dashes, en-dashes, or emojis in any file.** Code, docs, commits, handovers. Use hyphens.

10. **Simple UI/UX.** Negative space. WCAG AA contrast (see rule 21). No gratuitous animation. No dark patterns.

---

## Project Management (11-24)

11. **Stage-based execution.** Named stages, one at a time. A stage may span multiple chat turns but is one deliverable.

12. **Git branch model.** `main` protected, no direct pushes. Stage branches: `stage/NN-slug`. Feature branches: `feature/`, `fix/`, `chore/`, `docs/` off the current stage branch. Squash merges only.

13. **Commit convention.** `type(scope): subject`. Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`. Example: `feat(sync): add bisync conflict detection`.

14. **Per-stage handover document.** 12 fixed sections (see rule 25). No stage closes without a handover.

15. **Pre-change discussion.** Any change touching the parent, tokens, plugin infrastructure, locked decisions (DEC-*), or the rules themselves requires a written proposal in chat and sign-off from Shaunpetro before proceeding.

16. **Rollback contract.** Every stage handover includes exact rollback steps in section 11. Tested before merge.

17. **Test gate before handover.** Every stage passes 9 checks before handover is written: build succeeds, tests pass, clippy clean, ESLint clean, TypeScript compiles, no secrets committed, handover complete, rollback tested, CURRENT.md updated.

18. **Documentation debt register.** All TODOs live in `docs/backlog/BACKLOG.md`, never in code comments. Each entry has ID, description, blocking-status, owner.

19. **Dependency and scope guard.** No new plugin, library, or service without sign-off. New dependencies recorded in the current handover's section 10 (Dependency Inventory) before entering the repo.

20. **Retrospective and rule evolution.** Rules are versioned. Changes only at stage boundaries, via Pre-Change Discussion, and recorded in the rules changelog at the bottom of this file.

21. **Contrast fixed on touch.** Any CSS or SVG asset edited triggers a WCAG AA check on colors in that file. Results documented in the stage handover.

22. **Pre-stage holistic review.** Before each stage, trace every assumption, every dependency, every downstream effect. Fix or document before starting.

23. **Source vs build artifact.** Every file is one or the other. Build artifacts never enter the repo. Documented exceptions listed in rule 3.

24. **Path independence.** All code resolves paths dynamically via `path.join` / `PathBuf`. No hardcoded folder names, no `C:\`, no `/Users/`.

---

## Post-Stage 0 (25-35)

25. **Twelve-section handover.** Every handover contains: Stage Metadata, Prior Handover Reference, Where Project Started, Where Project Is Now, What Was Done, Known Bugs, Current Workings, Next Steps, Decision Log, Dependency Inventory, Rollback Contract, Fail-Safe Alignment. No exceptions.

26. **Install and activate are separate actions.** Provisioning a service (creating an account) is separate from activating it (adding keys to config). Both are recorded.

27. **Rebuild, do not patch, broken artifacts.** If a build is broken, delete the build output and rebuild clean. Do not apply fixes to stale artifacts.

28. **Test local before live.** No cloud configuration change without first testing against a local mock or staging bucket.

29. **Symbol preservation during full replacements.** Every public method, exported function, or module export in a file being replaced must still exist in the new file. If intentionally removed, the handover's section 9 (Decision Log) records it.

30. **One stage per session.** A stage may span multiple turns, but no parallel stages.

31. **Version bump on asset change.** When CSS, JS, or config JSON changes, the file's version reference (query string, header comment, or schema_version per rule 37) is bumped.

32. **Read before replacing.** Before shipping a full-file replacement, the current file is read in full via the fail-safe protocol (rule 26 of the architecture; see handover section 11).

33. **Cache purge after fatal.** After any fatal error or failed deploy, browser cache, plugin cache, and host cache are purged before re-testing.

34. **Local-first.** No cloud change without local validation. No exception.

35. **Zero-Context Master Handover.** Every handover is fully self-contained. A new developer reading only the handover (not the chat, not the git log) can understand the project's state, what was done, what remains, and why.

---

## UMS-Specific Architecture (36-40)

36. **Audit sidecar on every write.** Every S3 write from the sync agent or the app includes a companion audit record at `ums/orgs/{org-id}/audit/{yyyy}/{mm}/{dd}/{ts}-{uid}-{op}.json`. Contains: `user_id`, `device_id`, `operation`, `object_key`, `previous_version_id`, `content_hash`, `org_id`, `dept_id`. Append-only, never modified.

37. **schema_version on every stored config JSON.** Dashboards, branding manifests, token payloads, notification files, retention policies. Migrate-on-read pattern: reads run through a migration registry that upgrades old versions to current before consumption. Writes never migrate.

38. **bisync never touches Diwan.** The Diwan working directory is excluded from `rclone bisync` unconditionally. The editor owns its files. Enforced by a mandatory `--exclude` pattern in every bisync invocation.

39. **Fail-Safe Alignment in every handover.** Section 12 lists every file touched with SIG-1 (first line), SIG-2 (line count), SIG-3 (last commit), SIG-4 (first + last line). Required for verifying file identity when content is pasted in later sessions.

40. **Dependency sign-off before use.** Any new dependency (library, service, provider, plugin) is recorded in the current handover's section 10 before any code or config references it. Undeclared dependencies fail the test gate (rule 17).

---

## Asset Management (41-43)

41. **Asset sourcing.** All custom visual assets (app icons, tray icons, logos, empty states, error states, notification icons, file-type icons, illustrations, email headers) are authored as SVG sources in `assets/source/`. No binary asset enters the repo without an SVG source and a generation command recorded in `assets/README.md`. Stock assets permitted only with license record, source URL, attribution, and rule 19 sign-off.

42. **Asset inventory per stage.** Every stage handover lists all assets created, modified, or consumed in sections 5 (What Was Done) and 8 (Next Steps), with: asset ID (`SXX-AYY`), name, source path, target path, generation command, stage introduced.

43. **Asset naming.** SVG sources are `kebab-case.svg`. Generated outputs match source name with correct extension. No spaces, no capitals, no version suffixes. Versioning is via git.

---

## Rules Changelog

- **v1.0** (2026-10-28, adapted from upstream 35-rule set): Rules 1-35 adapted for Tauri + React + S3 stack. Rule 3 reversed from "no build step" to "build step required". Rules 5-8 adapted to language-appropriate standards.
- **v2.0** (2026-10-28, this version): Rules 36-40 added (UMS-specific architecture: audit, schema, Diwan isolation, fail-safe, dependency sign-off). Rules 41-43 added (asset management).