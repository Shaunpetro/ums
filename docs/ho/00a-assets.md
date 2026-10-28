# UMS Asset Specification - Companion to Founding Handover

Path: docs/handover/00a-assets.md
References: 00-founding.md
Rules active: 41, 42, 43
Last updated: 2026-10-28

---

## Section 1: Asset categories and ownership

- **App shell assets** (Stage 01): app icon, tray icon, installer graphics. Owned by Stage 01 handover.
- **Branding assets** (Stage 02): default org logo, favicon, login bg, email header. Owned by Stage 02 handover.
- **UI illustrations** (Stage 02+): empty states, error states, onboarding. Owned by the stage that introduces the feature they support.
- **Icon sets** (Stage 02+): notification icons, file-type icons, widget icons. Owned by the stage that introduces the corresponding feature.
- **Documentation illustrations** (non-blocking): README banner, architecture diagrams. Owned by whoever writes the docs.

---

## Section 2: Full inventory

Full table is maintained inline in the founding handover Section 5 and in each stage's handover.

Stage 01 required: S01-A01 through S01-A04.

---

## Section 3: Design system

### Colors

- **Primary (navy):** `#0f2744`
- **Accent (gold):** `#c98f39`
- **Neutral 200:** `#e2e8f0`
- **Neutral 400:** `#94a3b8`
- **Neutral 500:** `#cbd5e1`
- **White:** `#ffffff`

### Typography

- **Font family:** `system-ui, -apple-system, "Segoe UI", sans-serif`
- **Weights:** 400 (regular), 600 (semibold)
- **Sizes:** 16px minimum for body, 14px minimum for captions

### Geometry

- **App icon border radius:** 224px at 1024 viewBox (22%)
- **UI border radius:** 12px at 400 viewBox
- **Stroke widths:** 32 at 1024 viewBox, 3 at 400 viewBox, 2.5 at 32 viewBox

Every new asset must use these tokens. Deviations require Pre-Change Discussion (rule 15).

---

## Section 4: WCAG AA contrast check (rule 21)

Every asset with text must be checked at https://webaim.org/resources/contrastchecker/:

- `#0f2744` on `#ffffff`: **PASS (AAA)**
- `#c98f39` on `#0f2744`: **PASS (AA large)**
- `#ffffff` on `#0f2744`: **PASS (AAA)**
- `#94a3b8` on `#ffffff`: **PASS (AA large only, decorative use only)**

Document the check in the stage handover under section 5.

---

## Section 5: Licensing

All SVGs in `assets/source/` are authored in-house and are the property of ATG DesEng (PTY) LTD. Copyright: Ubuveil Apps (c) 2025/6 by Petro@ATG. No third-party assets permitted without rule 19 sign-off.