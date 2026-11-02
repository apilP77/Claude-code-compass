# Claude Code Compass — Design Direction

Status: **implemented on `feat/ui-redesign`** (steps 1-6 below). Vote counts on cards and mobile/contrast checks are still open.

## Intent

A calm, dark, developer-tool directory. It should feel like a well-made CLI
docs site: dense enough to scan quickly, quiet enough to trust. The product
promise is *honest curation*, so the design must make **verified vs AI-written
vs unreviewed** obvious at a glance without shouting.

Not: a neon "AI product" landing page, gradients everywhere, emoji as
decoration, or fake stats.

## Principles

1. **One palette, dark only.** No light mode and no `dark:` variants. One set
   of tokens in `globals.css`; components use tokens, never raw `slate-*` /
   `zinc-*` / `teal-*` classes.
2. **Content first.** Summaries and install commands are the product. Chrome
   (borders, glows, shadows) stays subtle.
3. **Color means something.** Each accent has exactly one job (below).
4. **Honest labels.** AI text is always labelled. "Verified" is only for
   reviewed listings.
5. **Accessible by default.** Text contrast >= 4.5:1, visible focus rings,
   44px touch targets, everything works with keyboard only.

## Color tokens

Background and surfaces (cool near-black, slightly blue):

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#0b0e13` | page background |
| `--surface` | `#11161d` | cards, panels |
| `--surface-2` | `#171e27` | hover, inputs, code blocks |
| `--border` | `#242d39` | default borders |
| `--border-strong` | `#34404f` | hover/focus borders |

Text:

| Token | Hex | Use |
|---|---|---|
| `--text` | `#e8edf3` | headings, primary text |
| `--text-muted` | `#a3afbd` | body copy, descriptions |
| `--text-faint` | `#7a8796` | meta, ids, captions (still >= 4.5:1 on `--bg`) |

Accents, **one job each**:

| Token | Hex | Job |
|---|---|---|
| `--accent` | `#5eead4` (teal) | primary actions, links, focus ring, active filter |
| `--ai` | `#c4b5fd` (violet) | AI-written content and its label, nothing else |
| `--verified` | `#6ee7b7` (green) | editor-verified listings only |
| `--star` | `#fcd34d` (amber) | star counts |
| `--warn` | `#fdba74` (orange) | unreviewed / stale / archived warnings |
| `--danger` | `#fca5a5` (red) | errors |

Each accent also has a 10-12% alpha fill and a 25% alpha border for badges
(e.g. `--ai` text on `--ai/10` fill with `--ai/25` border).

Category colors are **dropped**: four rainbow category pills made the cards
noisy. Category becomes a neutral label with a small icon.

## Typography

- **Sans:** Geist Sans (already loaded). Remove the `font-family: Arial`
  override in `globals.css` so it actually applies.
- **Mono:** Geist Mono for repo ids, commands, and counts.
- Scale: page title 40/48 (bold, -0.02em), section title 20/28 (semibold),
  card title 18/26 (semibold), body 15/24, small 13/20, mono-small 12/18.
- Line length for prose capped at ~65ch.

## Layout and spacing

- Spacing unit 4px; use 8 / 12 / 16 / 24 / 32 / 48.
- Page container `max-w-6xl`, horizontal padding 20px mobile, 32px desktop.
- Detail page: single column on mobile; on `lg` a two-column layout, content
  (`minmax(0, 1fr)`) plus a 280px sidebar.
- Radius: 8px controls, 12px cards and panels, full for chips and badges.
- Elevation: borders instead of shadows. Hover raises the border color, no
  large drop shadows or translate-up animations.

## Components

**Header** (sticky): wordmark left, `GitHub` link and a single
**Sign in with GitHub** button right (signed in: avatar + menu with Log out).
Solid `--bg` with a bottom border; no blur.

**Home hero**: shorter. Title, one-line value prop, search. Drop the eyebrow
and the second grey paragraph.

**Search + sort + filters**: search input updates results as you type (with a
small debounce), a **Sort** select (Most voted, Most stars, Recently added,
Name), and category chips. Result count and a "clear filters" link sit under
them. The URL stays the source of truth (`?q=&category=&sort=`).

**Repo card**:
```
owner/name (mono, faint)                     [category icon]
Repo name (title)
Summary, 3 lines max (muted)
[AI summary · not editor-verified]  or  [Verified]  or  [Unreviewed]
-----------------------------------------------------
* 1.2k stars   MIT license                 ▲ 12 votes
```
Whole card is a link; one hover state (border to `--border-strong`, name to
`--accent`). Badge text is sentence case, no emoji.

**Badges**: `Verified` (green), `AI summary · not editor-verified` (violet),
`Unreviewed` (orange, only when there is no summary). Neutral for license and
category.

**Detail page**, in order: breadcrumb, title + id + badges, **Summary**,
**Best for**, **Highlights**, **Getting started** (code block with Copy
button), **Pros / Cons** side by side, **Security notes**, **Community
score**. Sidebar (sticky on desktop): View on GitHub (primary button), stars,
forks, license, category, tags, last AI generation date and model.

**Vote control**: a compact pill, `▲ 12 ▼`, own vote highlighted
(`--accent` for up, `--danger` for down), disabled state while saving, and
the text "Sign in with GitHub to vote" for signed-out users. Keep the line
"Votes measure opinion, not security or correctness."

**Buttons**: primary = `--accent` fill with dark text; secondary = border +
`--text`; ghost for icon actions. 40px high, 44px on touch.

**States**: loading skeletons shaped like cards, friendly empty state ("No
repos match 'x'" with a clear button), inline error with a retry, and a real
404 page.

## Motion

Only `transition-colors` (150ms) and the focus ring. Respect
`prefers-reduced-motion`.

## Accessibility checklist

- Focus ring: 2px `--accent`, 2px offset, on every interactive element.
- Do not rely on color alone: badges carry text; votes show numbers.
- Skip-to-content link in the header.
- `aria-live` for vote and copy confirmations.
- Check contrast of `--text-faint` and every accent-on-fill combo.

## Out of scope for this pass

Light mode, a logo/brand mark, illustrations, new pages (the Skill Set Finder
is item 4 and will reuse these tokens and components).

## Implementation order

1. Tokens in `globals.css` (`@theme`), remove the Arial override, remove light
   mode, set the `<body>` background once in `layout.tsx`.
2. Header and footer.
3. Home: hero, search, sort, filters.
4. Repo card and badges.
5. Detail page and sidebar.
6. Vote control polish, states (loading, empty, error, 404).
7. Accessibility and mobile pass; typecheck, lint, test, build.
