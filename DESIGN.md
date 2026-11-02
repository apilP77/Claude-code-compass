# Claude Code Compass — Design Direction (v2)

Status: **implemented on `feat/ui-redesign` (v2, light survey chart).** Not yet reviewed visually in a browser. Vote counts on rows are still open.
`feat/ui-redesign` now; this replaces it once approved.

## Why v1 has to change

v1 hits two of the patterns that make a site read as AI-generated: a
near-black background with one bright accent (teal), and template chrome
(monospace micro-labels, "A · B" middle-dot labels, the ◈ glyph, a grid of
identical rounded cards). It was a safe default, not a choice made for this
product.

## Brief (proposed)

- **Subject:** a compass for Claude Code tools — a field guide that helps a
  developer find their way through a fast-growing, messy landscape of skills,
  plugins and collections.
- **Audience:** developers who use Claude Code and want something trustworthy
  to install, not a hype list.
- **Primary job:** search → judge quickly (what it is, is it checked, how to
  install) → open the right repo.
- **Feeling:** a well-made survey map. Precise, calm, quietly crafted. Trust
  comes from honesty labels, not from glow.

The world this borrows from: topographic survey maps, trail markers, a
compass needle, map legends, grid references. Used with restraint — no
pirate maps, no parchment, no puns in every heading.

## Tokens

Color — "survey chart", light, cool paper (not cream):

| Name | Hex | Role |
|---|---|---|
| `chart` | `#E8EDE9` | page background: cool grey-green map paper |
| `sheet` | `#F6F8F6` | raised surfaces: entries, sidebar, inputs |
| `ink` | `#16233A` | text, headings, primary button fill (deep survey navy) |
| `contour` | `#9FB4A9` | contour lines, borders, dividers (sage) |
| `lake` | `#2F6A8A` | links, focus, active filter, selected states |
| `blaze` | `#D9A21B` | trail-blaze yellow: stars, votes, the compass needle; one job, used sparingly |

Plus `ink-2 #4A5868` for secondary text and `ink-3 #66727F` for meta (both
>= 4.5:1 on `chart`), and status colors that carry text, never color alone:
verified `#2E7D5B`, AI-written `#6A5BA8`, unreviewed `#B0562A`, error `#B3261E`.

Type:

- **Archivo** (variable width) for headings, set **expanded** (width ~115)
  and semibold, like map lettering. The type itself is the visual identity.
- **Public Sans** for body and UI: plain, sturdy, built for government/map
  readability. 16px body, 1.6 line height, lines capped at 70ch.
- **JetBrains Mono** only for install commands and code. No monospace
  labels anywhere else.
- Scale: 48 / 32 / 24 / 20 / 16 / 14. Sentence case everywhere; no
  all-caps eyebrows, no accented single words, no "→" on buttons.

Shape: radius 6px on controls, 10px on panels, nothing fully rounded except
the compass and avatar. Depth from contour-colored hairlines and one soft
paper shadow on the sidebar only; no shadow under every card.

## Layout

**Home**: left-aligned, map-like. The hero is the memorable element.

```
┌──────────────────────────────────────────────────────────────┐
│ ◯ Claude Code Compass                    GitHub  [Sign in]   │
├──────────────────────────────────────────────────────────────┤
│  ~~~ contour lines drawn across the whole hero ~~~           │
│                                                    ╭──────╮  │
│  Find your way through                             │  N   │  │
│  Claude Code tools                                 │  ↑   │  │  <- live compass
│                                                    ╰──────╯  │
│  [ search skills, plugins, collections…      ] [Sort ▾]      │
│  Legend: ◆ Skills  ⬡ Plugins  ▤ Collections  ☰ Directories    │  <- legend = filters
├──────────────────────────────────────────────────────────────┤
│  Most starred                                                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │  <- 3 larger entries
│  └─────────────┘ └─────────────┘ └─────────────┘             │
│  All repositories (22)                                       │
│  ◆ agent-skills      25 engineering skills mapped…   MIT ★9k │  <- index rows,
│  ⬡ superpowers       A development methodology…      MIT ★4k │     not a card grid
│  …                                                           │
└──────────────────────────────────────────────────────────────┘
```

The full list is an **index of rows** (symbol, name, one-line summary,
status, license, stars, votes), like a field-guide index. Only the top three
"Most starred" get a larger entry. This breaks the identical-card grid and
scans faster. On phones, rows stack into two lines.

The category filter becomes a **map legend**: each category has its own
small symbol, and the same symbol marks each row.

**Detail page**: a field-guide entry.

```
 Directory / addyosmani / agent-skills
 ◆ agent-skills                                   ┌ Legend ──────┐
 addyosmani · Skills                              │ [View on GH] │
 AI-written summary — check the README            │ ★ 9,412      │
                                                  │ Forks 610    │
 Summary paragraph…                               │ MIT          │
 Best for … / Highlights … / Getting started [⧉]  │ Votes ▲ 12 ▼ │
 Pros | Cons / Security notes                     └──────────────┘
```

## Motion — one orchestrated moment, plus motion that answers you

Realistic means physical: things have weight, ease out, and settle. Nothing
loops for attention.

1. **On first load (the one moment):** the contour lines draw in (SVG
   stroke animation, ~1.2s), then the compass needle swings and settles with
   a damped spring, overshooting slightly like a real needle.
2. **The needle answers search:** as you type, it turns toward a bearing
   derived from the query and settles again. When nothing matches it wobbles
   and points to "clear filters".
3. **Results move, not flash:** filtering and sorting animate rows to
   their new positions (React `<ViewTransition>`), so you can see what
   changed.
4. **Row → detail morph:** the repo name and symbol morph from the list
   into the detail page heading (shared-element view transition), and back.
5. **Vote:** the arrow presses in, and the count rolls up or down to the new
   number.
6. **Copy:** the copy icon turns into a check, then back.
7. **Skeleton → content:** loading placeholders cross-fade into real rows.

Rules: no fade-and-slide on every section, no hover animation on every
card, no parallax. Hover changes color only. Everything respects
`prefers-reduced-motion` (animations become instant). No new animation
library: CSS, SVG and React's built-in `<ViewTransition>` (React 19.3,
supported by this Next.js with no config).

## Copy changes

- Hero: "Find your way through Claude Code tools", with a plain one-line
  explanation.
- Badges in plain words with no middle dot: "Reviewed", "AI-written
  summary", "Not yet reviewed".
- Buttons say what happens: "Sign in with GitHub", "Copy command", "Open on
  GitHub".

## Review against the brief (what I changed in this plan and why)

- First draft was dark navy with a glowing amber accent. That is still
  "near-black + one bright accent", so it moved to light chart paper.
- First draft used a serif display. Serif headings on pale paper read as
  the cream/serif AI default, so it moved to expanded Archivo, which
  comes from map lettering.
- Dropped numbered sections and the ALL-CAPS legend labels (template
  chrome). The legend uses symbols plus words in sentence case.

Not based on real-site references: UXKIN is not connected, so this
direction comes from the subject (survey maps) and the design rules, not
from comparing live sites.

## Quality floor (not announced in the UI)

Responsive at 375 / 768 / 1440, keyboard-only works, visible focus,
contrast >= 4.5:1, reduced motion respected, no layout shift while fonts
load (next/font).

## Build order

1. Tokens + fonts (Archivo, Public Sans, JetBrains Mono via next/font),
   remove v1 tokens.
2. Header, hero with contour SVG and compass (load animation + reduced
   motion).
3. Search, sort and legend filters; needle reacts to search.
4. "Most starred" entries + index rows; `<ViewTransition>` reordering.
5. Detail page as a field-guide entry; row→detail morph.
6. Vote count roll, copy check, skeleton cross-fade.
7. Review pass at three widths, keyboard and contrast; typecheck, lint,
   test, build; push the branch for a preview.
