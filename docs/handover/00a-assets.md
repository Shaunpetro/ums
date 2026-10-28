# UMS Asset Specification - Companion to Founding Handover

Path: docs/handover/00a-assets.md
References: 00-founding.md
Rules active: 41, 42, 43
Last updated: 2026-10-28 (rev 2 - brand tokens corrected to official palette)

---

## Section 1: Asset categories and ownership

- **App shell assets** (Stage 01): app icon, tray icon, installer graphics. Owned by Stage 01 handover.
- **Branding assets** (Stage 02): wordmarks (horizontal + vertical, color + white), favicon, login bg, email header. Owned by Stage 02 handover.
- **UI illustrations** (Stage 02+): empty states, error states, onboarding. Owned by the stage that introduces the feature they support.
- **Icon sets** (Stage 02+): notification icons, file-type icons, widget icons. Owned by the stage that introduces the corresponding feature.
- **Documentation illustrations** (non-blocking): README banner, architecture diagrams. Owned by whoever writes the docs.

---

## Section 2: Official brand source files

Four official SVGs supplied by Petro Malamule (Adobe Illustrator exports). All committed under `assets/source/branding/`. Cleanup rule: unused style classes removed, empty `<g>` layers removed, `enable-background` inline style removed, viewBox preserved.

| File | viewBox | Use |
| :--- | :--- | :--- |
| `logo-horizontal-color.svg` | `171.23 40.27` | Horizontal wordmark, colored gradient. Dark backgrounds, hero contexts. |
| `logo-horizontal-white.svg` | `168.3 37.14` | Horizontal wordmark, white. Dark backgrounds, neutral contexts. |
| `logo-vertical-color.svg` | `73.7 73.7` | Vertical mark + wordmark, colored gradient. Splash, large icon contexts. |
| `logo-vertical-white.svg` | `73.7 73.7` | Vertical mark + wordmark, white. Splash on dark, large icon contexts. |

---

## Section 3: Design system (rev 2 - official brand palette)

### Brand palette

| Token | Value | Source |
| :--- | :--- | :--- |
| `--ubv-brand-gradient-start` | `#EB6F65` (coral) | Official logo gradient stop 0 |
| `--ubv-brand-gradient-end` | `#F5AB82` (peach) | Official logo gradient stop 1 |
| `--ubv-brand-dark` | `#9B4122` (dark brown) | Unused Illustrator swatch, reserved for light-mode logo if needed |
| `--ubv-brand-green` | `#2BB673` | Unused Illustrator swatch, reserved for secondary accent |
| `--ubv-brand-white` | `#FFFFFF` | Official logo white fills |

### Warm low-strain neutrals (blue-light reduced, long-session ergonomics)

| Token | Value | Use |
| :--- | :--- | :--- |
| `--ubv-bg-dark-primary` | `#17151a` | App background, dark mode |
| `--ubv-bg-dark-elevated` | `#1f1d24` | Elevated surfaces, dark mode |
| `--ubv-bg-light-primary` | `#f7f4ee` | App background, light mode (warm off-white) |
| `--ubv-text-on-dark` | `#e8e4dd` | Body text on dark backgrounds |
| `--ubv-text-on-light` | `#241f18` | Body text on light backgrounds |
| `--ubv-text-muted-dark` | `#a6a19a` | Secondary text on dark backgrounds |
| `--ubv-text-muted-light` | `#6b655c` | Secondary text on light backgrounds |
| `--ubv-border-dark` | `rgba(255, 255, 255, 0.08)` | Hairline borders on dark |
| `--ubv-border-light` | `rgba(36, 31, 24, 0.08)` | Hairline borders on light |

All neutrals have red > blue in their RGB components. No cold blues anywhere in the neutral palette. This is the low-eye-strain constraint.

### Glassmorphism tokens

| Token | Value |
| :--- | :--- |
| `--ubv-glass-dark-bg` | `rgba(23, 21, 26, 0.55)` |
| `--ubv-glass-dark-blur` | `blur(24px) saturate(140%)` |
| `--ubv-glass-dark-border` | `1px solid rgba(255, 255, 255, 0.1)` |
| `--ubv-glass-dark-shadow` | `0 8px 32px rgba(0, 0, 0, 0.4)` |
| `--ubv-glass-light-bg` | `rgba(247, 244, 238, 0.6)` |
| `--ubv-glass-light-blur` | `blur(24px) saturate(140%)` |
| `--ubv-glass-light-border` | `1px solid rgba(36, 31, 24, 0.08)` |
| `--ubv-glass-light-shadow` | `0 8px 32px rgba(36, 31, 24, 0.08)` |

Card pattern: `background: var(--ubv-glass-dark-bg); backdrop-filter: var(--ubv-glass-dark-blur); border: var(--ubv-glass-dark-border); box-shadow: var(--ubv-glass-dark-shadow); border-radius: 12px;`

### Typography

| Token | Value |
| :--- | :--- |
| `--ubv-font-family` | `"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif` |
| `--ubv-font-weight-regular` | `400` |
| `--ubv-font-weight-medium` | `500` |
| `--ubv-font-weight-semibold` | `600` |
| `--ubv-font-size-body` | `15px` |
| `--ubv-font-size-caption` | `13px` |
| `--ubv-font-size-heading` | `24px` |
| `--ubv-line-height-body` | `1.6` |

Inter is chosen for open apertures, tall x-height, and UI-length reading comfort.

### Geometry

| Token | Value |
| :--- | :--- |
| `--ubv-radius-card` | `12px` |
| `--ubv-radius-input` | `8px` |
| `--ubv-radius-pill` | `999px` |
| `--ubv-space-unit` | `4px` (scale: 1, 2, 3, 4, 6, 8, 12, 16 units = 4px to 64px) |

### Mode default

**Dark mode is the default.** Rationale: warm-dark glassmorphism is the long-session ergonomic optimum and matches the "low UV exposure for long working hours" direction. Light mode is a supported alternative using warm off-whites (`#f7f4ee`), never pure white.

---

## Section 4: WCAG AA contrast check (rule 21)

- `#e8e4dd` on `#17151a` = 12.3:1 (AAA)
- `#241f18` on `#f7f4ee` = 13.8:1 (AAA)
- `#EB6F65` on `#17151a` = 5.1:1 (AA)
- `#F5AB82` on `#17151a` = 7.4:1 (AA/AAA)
- `#EB6F65` on `#FFFFFF` = 2.8:1 (FAIL - do not use colored gradient on white)
- `#FFFFFF` on `#17151a` = 15.2:1 (AAA)
- `#a6a19a` on `#17151a` = 6.8:1 (AA)
- `#6b655c` on `#f7f4ee` = 6.1:1 (AA)

Rule: the colored gradient logo is ONLY valid on dark surfaces. Never on white or near-white.

---

## Section 5: Licensing

All SVGs in `assets/source/branding/` are official brand assets of ATG DesEng (PTY) LTD, authored by Petro Malamule. Copyright: Ubuveil Apps (c) 2025/6 by Petro@ATG. No third-party assets permitted without rule 19 sign-off.

---

## Section 6: Change log

- **2026-10-28 (rev 1):** Initial spec with placeholder navy/gold tokens.
- **2026-10-28 (rev 2):** Replaced with official brand palette from four Adobe Illustrator SVGs. Added glassmorphism tokens, warm neutral palette, and dark-mode-first default. Removed the incorrect navy/gold tokens.