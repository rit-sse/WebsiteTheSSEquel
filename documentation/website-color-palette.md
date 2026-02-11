# Website Color Palette

This palette is logo-first and Radix-inspired, with a neobrutalist aesthetic.  
Logo source colors: `#426E8C`, `#5289AF`, `#86ACC7`.

## Primary Palette (Brand Ramp)

Radix-style 12-step ramp for consistent UI depth and interaction mapping.

| Token | Hex | Role |
| --- | --- | --- |
| `primary-1` | `#F7FAFD` | App background tint |
| `primary-2` | `#EFF5FA` | Subtle backgrounds |
| `primary-3` | `#E2EDF6` | UI default soft fills |
| `primary-4` | `#D3E3F0` | UI hover soft fills |
| `primary-5` | `#C1D6E8` | UI pressed soft fills |
| `primary-6` | `#A9C6DD` | Subtle border color |
| `primary-7` | `#86ACC7` | Interactive border/focus soft |
| `primary-8` | `#6A98B8` | Strong border/focus |
| `primary-9` | `#5289AF` | Solid primary background |
| `primary-10` | `#426E8C` | Solid primary hover |
| `primary-11` | `#345970` | Low-contrast brand text |
| `primary-12` | `#1B303F` | High-contrast brand text |

## Light Theme Depths

Slate-blue progression with toned-down saturation (saturation decreases with depth to avoid vivid blue splashes).

| Token | HSL | Hex (approx) | Role |
| --- | --- | --- | --- |
| `surface-0` | `220 52% 96%` | `#EEF2F9` | Page background (gradient start) |
| `surface-1` | `222 58% 93%` | `#E4EAF5` | Page background (gradient end) |
| `surface-2` | `218 50% 89%` | `#D6DEF0` | Primary cards, panels |
| `surface-3` | `216 42% 84%` | `#C7D1E2` | Inner cards (card-in-card) |
| `surface-4` | `214 36% 79%` | `#B9C3D4` | Emphasis / deeply nested containers |

## Dark Theme Depths

Vibrant slate-blue progression with increasing saturation for rich depth.

| Token | HSL | Hex (approx) | Role |
| --- | --- | --- | --- |
| `surface-0` | `222 34% 14%` | `#181F2E` | Page background |
| `surface-1` | `220 40% 21%` | `#1F2D42` | Secondary sections |
| `surface-2` | `217 46% 29%` | `#283D58` | Primary cards, panels |
| `surface-3` | `213 52% 38%` | `#2E5278` | Inner cards (card-in-card) |
| `surface-4` | `208 58% 48%` | `#3371A3` | Emphasis / deeply nested containers |

## Categorical Colors (New Tableau 10)

Theme-aware: light mode uses deeper tones for contrast on pale backgrounds, dark mode uses the original vibrant Tableau 10.

### Light Mode

| Token | HSL | Hex (approx) | Name |
| --- | --- | --- | --- |
| `chart-1` | `211 36% 48%` | `#4E79A7` | Blue |
| `chart-2` | `25 75% 38%` | `#A85A11` | Deep Amber |
| `chart-3` | `359 65% 48%` | `#C92B2E` | Crimson |
| `chart-4` | `175 40% 40%` | `#3D8E89` | Deep Teal |
| `chart-5` | `113 40% 36%` | `#378137` | Forest Green |
| `chart-6` | `42 70% 38%` | `#A57B1D` | Dark Gold |
| `chart-7` | `317 30% 46%` | `#985298` | Plum |
| `chart-8` | `354 60% 52%` | `#C93D49` | Rose |
| `chart-9` | `22 30% 40%` | `#854F38` | Sienna |
| `chart-10` | `17 12% 52%` | `#947E76` | Warm Gray |

### Dark Mode

| Token | HSL | Hex (approx) | Name |
| --- | --- | --- | --- |
| `chart-1` | `211 36% 48%` | `#4E79A7` | Blue |
| `chart-2` | `30 88% 56%` | `#F28E2B` | Orange |
| `chart-3` | `359 70% 61%` | `#E15759` | Red |
| `chart-4` | `175 31% 59%` | `#76B7B2` | Teal |
| `chart-5` | `113 34% 47%` | `#59A14F` | Green |
| `chart-6` | `47 82% 61%` | `#EDC948` | Yellow |
| `chart-7` | `317 25% 58%` | `#B07AA1` | Purple |
| `chart-8` | `354 100% 81%` | `#FF9DA7` | Pink |
| `chart-9` | `22 24% 49%` | `#9C755F` | Brown |
| `chart-10` | `17 9% 70%` | `#BAB0AC` | Gray |

## Accent Colors

| Token | HSL | Hex (approx) | Role |
| --- | --- | --- | --- |
| `accent-1` | `41 75% 84%` | `#F5E2B8` | Soft highlight / sticker tint |
| `accent-2` | `120 43% 87%` | `#CFECCF` | Pastel mint callout background |
| `accent-3` | `38 80% 57%` | `#E9A83B` | Warm CTA accent |
| `accent-4` | `213 65% 58%` | `#4D8DD9` | Primary interactive accent (playful blue) |
| `accent-5` | `15 57% 58%` | `#D17759` | Hover/pressed alt accent (sunset coral) |
| `accent-6` | `321 28% 51%` | `#A45E8C` | Contrast accent for badges/callouts |

## UI Role Mapping

### Text Hierarchy (using categorical palette)

| Role | Light Mode | Dark Mode |
| --- | --- | --- |
| Page headings (h1) | `text-foreground` | `text-foreground` |
| Section headings (h2) | `chart-7` (plum) | `chart-8` (pink) |
| CTA headings (h3) | `chart-2` (deep amber) | `chart-8` (pink) |
| Hero dancing text | `chart-2` (deep amber) | `chart-2` (orange) |
| Labels / metadata | `chart-2` (deep amber) | `chart-8` (pink) |
| Links | `chart-4` (deep teal) | `chart-4` (teal) |
| Link hover (icons) | `chart-4` (deep teal) | `chart-4` (teal) |

### Buttons

| Variant | Background | Text | Purpose |
| --- | --- | --- | --- |
| Default | `chart-2` | white | Primary action |
| Reverse | `chart-7` | white | Secondary action |
| Accent | `chart-5` | white | Tertiary / success action |
| Outline | `surface-2` | foreground | Neutral action |
| Destructive | destructive | white | Dangerous action |
| NeoBrutalist CTA | `accentScale-4` / custom | black | Hero CTA only |

### Tags / Badges (categorical fill + foreground text)

All badge variants use a categorical color as background fill (25-30% opacity) with `text-foreground`:

| Variant | Color | Use |
| --- | --- | --- |
| `cat-1` | Blue | Counts, primary info |
| `cat-2` | Orange/Amber | Ranks, occurrences |
| `cat-3` | Red/Crimson | Inactive, errors |
| `cat-4` | Teal | Attendees, event links |
| `cat-5` | Green | Success, active, membership |
| `cat-6` | Yellow/Gold | Pending, warnings |
| `cat-7` | Purple/Plum | Series, committee |
| `cat-8` | Pink/Rose | Decorative |
| `cat-9` | Brown/Sienna | Secondary info |
| `cat-10` | Gray | Subtle info |

### Backgrounds

- `bg-canvas`: `surface-0` / `surface-0`
- `bg-subtle`: `surface-1` / `surface-1`
- `bg-raised`: `surface-2` / `surface-2`
- `bg-overlay`: `surface-3` / `surface-3`

### Borders and Separators

Borders use `foreground`-based opacity for guaranteed contrast (since `border` color is the same hue as surfaces):

| Context | Opacity | Notes |
| --- | --- | --- |
| Depth-1 card (neo) | `border-black` | Full neobrutalist statement |
| Depth-2 card (neo) | `foreground/20` | Visible inner card edge |
| Depth-3 card (neo) | `foreground/18` | Subtle emphasis edge |
| Depth-1 card (clean) | `border/30` | Soft shadow carries depth |
| Depth-2 card (clean) | `foreground/15` | Clean visible edge |
| Table header | `foreground/20` | Clear section separator |
| Table row | `foreground/12` | Subtle row divider |
| Data table wrapper | `foreground/18` | Container edge |

### Interactive Components

- `interactive-primary-default`: `primary-9`
- `interactive-primary-hover`: `primary-10`
- `interactive-focus-ring`: `primary-8`
- `interactive-disabled`: `#B9C8D6` (light), `#3B4E60` (dark)

### Accessible Text

- `text-high-light`: `#111E2A` — `text-foreground`
- `text-mid-light`: `#2D4458` — `text-mid`
- `text-subtle-light`: `#4F667A` — `text-subtle`
- `text-high-dark`: `#EAF2F8` — `text-foreground`
- `text-mid-dark`: `#C2D2E0` — `text-mid`
- `text-subtle-dark`: `#98AFC3` — `text-subtle`
- `text-on-brand-strong`: `#FFFFFF`
- `text-on-brand-base`: `#0E151D`

## Accessibility Notes (Key Pairs)

- `#111E2A` on `#EEF2F9`: `~15:1` (AAA)
- `#4F667A` on `#E4EAF5`: `~5:1` (AA)
- `#EAF2F8` on `#181F2E`: `~14.5:1` (AAA)
- `#A85A11` on `#EEF2F9`: `~5.2:1` (AA) — light mode chart-2 on bg
- `#F28E2B` on `#181F2E`: `~6.8:1` (AA) — dark mode chart-2 on bg
- `#FFFFFF` on `#A85A11`: `~4.6:1` (AA) — white text on light buttons
- `#FFFFFF` on `#F28E2B`: `~2.3:1` — dark mode buttons (large text OK)

## Radix-Inspired Validation Notes

- Structure follows Radix 12-step intent:
  - `1-2` backgrounds
  - `3-5` component backgrounds
  - `6-8` borders/focus
  - `9-10` solids
  - `11-12` text
- The hue progression is tuned to logo blues first, then adjusted to keep step transitions perceptually smooth.
- Light mode categorical colors are deliberately darker than standard Tableau 10 to maintain WCAG AA contrast on pale blue-gray backgrounds.
- Dark mode categorical colors use the original vibrant Tableau 10 values which naturally pop on dark surfaces.
- Accent colors are intentionally separate from the primary ramp to preserve hierarchy between brand identity and action emphasis.
