# Design Direction — "Console"

> A dark, precise, **terminal-native** install surface. The app should feel like a tool that
> belongs next to Cursor and a terminal — not a magazine. This file is the north star for a
> reskin; the information architecture and flows stay, the *skin* changes completely.

## North star

**References:** Cursor, OpenAI Codex, Linear, Vercel dashboard, Raycast, GitHub (dark).
**One-line identity:** _"It reads like `git diff` and installs like a tool you trust."_

The current build is warm, paper-toned, serif, editorial (Fraunces + cream + rubber stamps +
wax seal). That's the thing to kill. We go **cool, dark, monochrome-forward, monospace-aware,
keyboard-first** — high signal, low ornament.

## What changes

| | Current ("Behavior Catalog") | New ("Console") |
| --- | --- | --- |
| Mood | warm paper, editorial, cozy | dark, neutral, engineered, sharp |
| Base | cream `#F2EDE3` | near-black `#0B0C0E` |
| Display font | Fraunces (serif) | **Geist Sans**, tight tracking, heavier weights |
| Accent | vermillion `#DA3A1C` | one cool accent, used sparingly (see "Accent") |
| Devices | folio numerals, rubber stamps, wax seal, paper grain, kicker ticks | status pills, hairline rules, mono labels, kbd hints, command-palette spine |
| Signature | "the galley proof" (printer's proof) | **the plan reads like a diff** (`+ added`, gutter, mono) |
| Density | magazine whitespace | app-dense but breathable |

Keep what's good underneath: the IA (Browse → Pack → Configure → **Plan/Proof** → Activate →
Library), the mandatory dry-run gate, the first-class trust surface, the `omc …` command echo,
the agent roster. Just re-dress them.

## Color tokens (dark)

Cool neutrals (a hair of blue in the grays), GitHub/Linear-dark lineage. Layer by **lightening
the surface**, not by heavy shadows.

```css
:root {
  /* surfaces — each step = one elevation level */
  --bg:            #0B0C0E;  /* app background (near-black, slightly cool) */
  --surface:       #131417;  /* panels, cards */
  --surface-2:     #191B1F;  /* elevated / hover / popover */
  --surface-inset: #0E0F12;  /* code/diff wells, inputs */

  /* lines */
  --border:        #232529;  /* hairline default */
  --border-strong: #313438;  /* emphasized / focus-within */

  /* text */
  --text:          #E6E8EB;  /* primary (near-white, not pure) */
  --text-2:        #9BA1A9;  /* secondary */
  --text-3:        #6B7178;  /* tertiary / muted labels */

  /* accent — primary actions + active state ONLY (see "Accent").
     SELECTED: near-monochrome — accent ≈ near-white; semantics carry all color. */
  --accent:        #E6E8EB;  /* near-white */
  --accent-hover:  #F4F5F7;
  --accent-ink:    #C9CDD3;  /* secondary interactive tone (hover borders) */

  /* semantic — used for the diff statuses + states */
  --add:    #3FB950;  /* new / installed (green) */
  --change: #D29922;  /* update (amber) */
  --muted:  #6B7178;  /* unchanged (grey, de-emphasized) */
  --remove: #F85149;  /* user-modified→backup, destructive (red) */

  /* shape */
  --radius:    8px;
  --radius-sm: 6px;
  --radius-lg: 12px;
  --shadow-pop: 0 8px 30px -8px rgba(0,0,0,0.6), 0 0 0 1px var(--border);
  --ring: 0 0 0 1px var(--bg), 0 0 0 3px color-mix(in oklab, var(--accent) 70%, transparent);
}
html { color-scheme: dark; }
```

Rule: **the diff status colors (green/amber/grey/red) and the accent must never collide** — accent
is for *actions*, semantics are for *state*. Status is always conveyed by **icon/label + color**,
never color alone.

## Typography

Drop the serif entirely. The dev-tool signal comes from a clean grotesk + a real mono.

- **Geist Sans** — UI, headings, body. Tight tracking on large sizes (`-0.02em`), weight 600–700
  for headings, 400–500 for body. (Google Fonts: `Geist`.)
- **Geist Mono** — every machine-truthful token: file paths, model slugs, versions, counts, the
  `omc` command echo, kbd hints, the diff. (Google Fonts: `Geist Mono`.) This is the through-line
  that makes it feel like a tool.
- No third typeface. Hierarchy comes from **weight + size + color**, not font-switching.

```
Hero/H1   Geist 700  28–32px  -0.02em
Section   Geist 600  15px     uppercase 0.04em  color:text-3   (mono optional for "labels")
Body      Geist 400  14px/1.6 color:text-2
Mono      Geist Mono 12.5–13px  color:text  (tabular-nums for counts)
```

## Geometry · density · elevation

- **Hairline 1px borders** (`--border`) on everything; that's the primary structure, not shadows.
- Consistent radii (`8px` default). Inputs/cards/buttons share the scale.
- **Density:** tighter than now. Think Linear list rows (40–44px), 12–16px gutters, a persistent
  left rail. Less hero, more content.
- Elevation = surface step (`--surface` → `--surface-2`) + a hairline. Shadows only for true
  overlays (popovers, command palette).
- A faint top "app chrome" bar (drag region in Tauri) with the product mark + a ⌘K affordance.

## Component language

- **Buttons.** Primary = solid `--accent` on dark, `--radius`, 500 weight, subtle hover lift
  (`translateY(-1px)` + brighten). Secondary = `--surface-2` + hairline border. Ghost = text-2,
  hover text + `--surface`. Destructive = `--remove` outline → solid on confirm. Always a
  `focus-visible` ring (`--ring`).
- **Inputs.** `--surface-inset`, hairline border, mono for paths, `--accent` border on focus.
  Inline validation in `--remove`. A `⌘O` hint to open the native folder picker.
- **Cards (pack tiles).** `--surface`, hairline, hover → `--surface-2` + border-strong + 1px lift.
  Title (Geist 600), one-line desc (text-2), a row of **status chips** (trust + category) in mono.
- **Chips / badges.** Small, mono, `--surface-2` fill + hairline; semantic variants tint text only
  (e.g. shell-hooks = amber text, network-none = green text). Replaces the rubber stamps.
- **Trust surface.** A compact, scannable strip: `shell-hooks ●  git-hooks ●  network ○` with a
  `writes →` expander showing the verbatim paths in a mono well (`--surface-inset`). Reads like a
  permissions manifest, not a stamp.
- **Nav / rail.** Left rail with Collection / Library + the install-target (scope/repo) pinned;
  active item = `--accent-quiet` fill + `--accent` left-border. A ⌘K command palette is the spine.
- **Empty/loading.** Skeleton rows in `--surface-2`; spinner only for actions. Loading copy ends
  with `…`.

## Signature: the plan **is** a diff

The dry-run gate stops being a "printer's proof" and becomes what devs already trust — a **review
screen that looks like `git diff` / `terraform plan`**:

- A mono well (`--surface-inset`) grouped by tool → group.
- Left gutter glyphs + color: `+` green (new), `~` amber (update), `·` grey dim (unchanged,
  collapsed), `!` red (user-modified → ` backed up to *.omc-bak`).
- A **running head** = the literal `omc plan …` command + the summary counts (`+78  ~0  ·0  !0`).
- The git-hook verdict + trust manifest sit beside it as panels.
- Primary action **`Review → Install`** stays disarmed until the user has seen the plan (a checkbox
  "I've reviewed the changes" or an explicit scroll-to-bottom), replacing the wax-seal ritual with
  a dev-native one.

```
┌─ install · team-avatar ──────────────────────────────── ⌘↵ install ─┐
│ $ omc plan team-avatar --scope project --repo ~/app      [copy]      │
│ +78  ~0  ·0  !0        target ~/app/.cursor      cursor               │
├──────────────────────────────────────────────────────────────────────┤
│ cursor / agents                                                      │
│  + agents/aang.md                                                    │
│  + agents/sokka.md                                                   │
│ cursor / hooks                                                       │
│  + hooks/guard-shell.sh                                              │
│ cursor / skills            · 21 unchanged   ▸                        │
├── trust ────────────────────────  ── git hook ─────────────────────  │
│ shell ●  git ●  network ○         .git/hooks/pre-commit · will write  │
│ writes → ~/app/.cursor/**         ──────────────────────────────────  │
├──────────────────────────────────────────────────────────────────────┤
│ ☐ I've reviewed the changes              [ cancel ]  [ Install → ]    │
└──────────────────────────────────────────────────────────────────────┘
```

And the gallery, restyled — dense, dark, scannable:

```
┌ oh-my-cursor ───────────────────────────────────────────  ⌘K ───────┐
│ COLLECTION                                            scope ▸ project │
│ LIBRARY  3                                            repo  ~/app     │
├──────────┬───────────────────────────────────────────────────────────┤
│ FILTERS  │  team-avatar                              v0.5.0  · team   │
│ ▸ team   │  Avatar-themed 8-agent dev team for Cursor.                │
│ ▸ role   │  shell ●  git ●  net ○   · 21 skills   community/parody    │
│ ▸ harness│  ───────────────────────────────────────────────────────  │
│ trust    │  principal-engineer                       coming soon      │
│ ☐ shell  │  api-architect                            coming soon      │
│ ☐ git    │                                                            │
└──────────┴───────────────────────────────────────────────────────────┘
```

## Motion

Fast and quiet (Linear/Raycast): 120–160ms, `ease-out`, `transform`+`opacity` only. Hover lifts,
focus rings, command-palette fade/scale. No bounce, no glow, no auto-play. Honor
`prefers-reduced-motion` (instant states).

## Accent — pick one (one-line token change)

| Option | `--accent` | Reads as |
| --- | --- | --- |
| Blue | `#4C8DFF` | Cursor / VS Code, calm + trustworthy |
| Green (terminal) | `#3FB950` | Codex / shell, "it ran clean" — but watch overlap with the `+add` status |
| **Near-monochrome** ✓ SELECTED | `#E6E8EB` | Vercel/Linear minimal — accent ≈ white; semantics carry all color |

**Selected: near-monochrome.** The accent is near-white (`#E6E8EB`), used only for primary
actions + active/selected state; all hue is carried by the semantic diff colors (green/amber/grey/red).
This is the most "Codex"/terminal-minimal of the three and keeps the signature diff the only place
color lives.

## Implementation cost (when you say go)

This is mostly a **token swap + a few component reskins**, not a rewrite — the IA, routes, engine,
and component contracts all stay:

1. Swap `tokens.css` + the Tailwind `@theme` (colors, fonts, radii) → ~1 file.
2. Switch fonts in `index.html` (Geist + Geist Mono) and drop Fraunces.
3. Reskin ~6 primitives (Masthead→app bar, CategoryKicker→chip, TrustStamps→manifest strip,
   WaxSeal→review-checkbox, ProofRow→diff line, FanImprint→badge) — props unchanged.
4. Light density pass on the 6 screens (rail, spacing).

Estimate: a focused pass; reversible (it's all tokens + presentational components).
