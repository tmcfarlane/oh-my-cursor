# Behavior Pack Format

A **behavior pack** is the unit oh-my-cursor installs into a repo's (or user's) Cursor
config. This document specifies the `pack.json` manifest and the registry index. It is the
contract the installer engine (and, later, the CLI and desktop gallery) consume.

> Status: format v1, introduced alongside v0.4.2. Today the repo ships **one** pack —
> [`team-avatar`](../packs/team-avatar/pack.json) — and the legacy shell installer still
> drives installs. The manifest describes the existing install set; later phases make the
> installer read it. See [`ROADMAP-v0.5-marketplace.md`](./ROADMAP-v0.5-marketplace.md).

## Layout

```
packs/<id>/
  pack.json            # the manifest (required)
  agents/ rules/ commands/ hooks/ skills/ assets/   # pack content (or referenced via sourceRoot)
  permissions.json hooks.json                       # Cursor config
  scripts/             # optional lifecycle scripts (opt-in, never run silently)
registry/
  registry.json        # index of available packs (the repo is the default registry)
packages/schema/
  pack.schema.json     # JSON Schema for pack.json
  registry.schema.json # JSON Schema for registry.json
  valid-slugs.json     # authoritative Cursor model-slug allowlist
```

## `pack.json`

Validated against [`packages/schema/pack.schema.json`](../packages/schema/pack.schema.json).

| Field | Req | Meaning |
| --- | --- | --- |
| `schemaVersion` | ✓ | Format version (`1`). |
| `id` | ✓ | Unique kebab-case registry key. |
| `name`, `description` | ✓ | Human-facing. |
| `version` | ✓ | Semver; drives upgrades. |
| `author`, `license`, `homepage` | | Provenance. |
| `category` | ✓ | `team` \| `role` \| `harness` \| `theme`. |
| `tags` | | Discovery keywords. |
| `theme` | | Persona/skin overlay metadata. `theme.fan: true` flags third-party IP. |
| `capabilities` | | What the agents do (decoupled from theme). |
| `extends` | | Base pack id this pack composes on. |
| `requires` | | `{ cursor: ">=3.4", packs: [] }` environment/peer gates. |
| `sourceRoot` | | Root that `contents` globs resolve against, relative to the pack dir. Defaults to `.`. Transitional packs may use `../..` (repo root) until files are relocated. |
| `models` | | `{ default, overrides }` — **every slug is validated** against `valid-slugs.json`. |
| `contents` | ✓ | Globs (relative to `sourceRoot`) → Cursor config groups (`agents`/`rules`/`commands`/`hooks`/`config`/`assets`). Each present group must match ≥1 file. |
| `skills` | | Bundled skills with provenance: `{ name, source, agents }`. Source of truth for `skills.json`; each `name` maps to `skills/<name>/SKILL.md`. |
| `scopes` | | `user` and/or `project`. |
| `tools` | | Mirror targets: `cursor`/`claude`/`codex`. |
| `permissions` | | Declarative trust surface: `shellHooks`/`gitHooks`/`network`/`writes`. Shown before apply. |
| `scripts` | | Optional `postInstall`/`validate`/`preUninstall`. **Default-off; source shown and confirmed before running.** |
| `activation` | | Manual post-install steps Cursor requires (`Always Allow`, restart) that the installer cannot bypass. |
| `uninstall.extraPaths` | | Out-of-tree artifacts (e.g. `.git/hooks/pre-commit`) uninstall must also remove. |

### Capability vs theme

Capability (what agents *do*) is decoupled from theme (the persona skin). `team-avatar` is a
full dev-team **capability** plus an ATLA **theme**. This lets one capability ship many skins
and isolates fan/IP content to overlays (`theme.fan: true`), which keeps copyrighted material
out of the default-distributed set.

## `registry.json`

Validated against [`packages/schema/registry.schema.json`](../packages/schema/registry.schema.json).
Lists each pack's `id`, `path` (local path, git URL, or future remote), `version`, `category`,
`tags`, `summary`, and `validatedCursor`. The repo is the default registry; future hosted
discovery just serves a `registry.json`.

## Model slugs (the silent-downgrade footgun)

An invalid or stale Cursor `model:` slug **does not error — it silently downgrades to
`composer-2.5-fast`** ([`VALIDATION.md`](../VALIDATION.md) gotcha #1). So every slug a pack
declares — in `models` and in each agent's frontmatter — is checked against
[`packages/schema/valid-slugs.json`](../packages/schema/valid-slugs.json). Re-verify that list
after every Cursor update.

## Validation

```bash
node scripts/validate-packs.mjs
```

Zero-dependency (plain `node` ≥ 22). It enforces, and CI gates on:

1. `registry.json` matches its schema.
2. Every registry pack path exists and has a `pack.json`.
3. Every `pack.json` matches its schema.
4. Every `contents` glob resolves to ≥1 file.
5. Every declared model slug is valid.
6. Every resolved agent file's frontmatter `model:` is valid (automates the VALIDATION.md sweep).

A pack cannot enter the registry without passing. Wire your editor to
`pack.schema.json` / `registry.schema.json` for inline authoring help.

## Generated manifests (single source of truth)

`plugin.json` and `skills.json` are **generated from `pack.json`** — they are not hand-edited:

```bash
node scripts/generate-manifests.mjs          # regenerate after changing pack.json
node scripts/generate-manifests.mjs --check   # CI drift gate
```

- `plugin.json` file arrays (`agents`/`rules`/`commands`/`hooks`/`config`) are derived from the
  pack's `contents` globs. Project scalars (`name`/`version`/`description`/…) are preserved.
- `skills.json` is derived from the pack's `skills` provenance list. `bundled`/`updated` are
  preserved.

CI fails if either committed file drifts from the generator output, so `pack.json` stays the
sole source of truth. (`install.sh`/`install.ps1` still carry their own file arrays — those are
retired once the installer bootstrap reads the manifest directly.)

## Installer engine & `omc` CLI (Phase 2)

`@oh-my-cursor/core` (`packages/core/`) is the manifest-driven install engine — the same logic
the shell installer hardcodes, but driven entirely from `pack.json`:

```
loadPack → planInstall → applyInstall → (lockfile) → uninstallPack
```

- **plan** resolves `contents` globs + `skills` to destination files for each tool, applies the
  scope/tool rules (`config` and the git pre-commit hook are project+cursor only; `skills` are
  cursor-only), and diffs against the filesystem (+ prior lockfile) → `new`/`update`/`unchanged`/
  `userModified`.
- **apply** copies files, `chmod +x`es shell hooks, backs up user-modified files to `*.omc-bak`,
  installs the git hook, and records everything in a **lockfile** at
  `<cursorDir>/.oh-my-cursor/lock.json`.
- **uninstall** reads the lockfile and removes exactly what was written (+ our git hook), pruning
  now-empty directories — leaving no trace.

The `omc` CLI (`packages/cli/omc.mjs`) wraps it:

```bash
node packages/cli/omc.mjs list
node packages/cli/omc.mjs info team-avatar
node packages/cli/omc.mjs plan team-avatar --scope project --repo .   # preview diff
node packages/cli/omc.mjs install team-avatar [--scope] [--tools cursor,claude,codex] [--dry-run]
node packages/cli/omc.mjs status
node packages/cli/omc.mjs uninstall team-avatar
```

**Parity gate:** `packages/core/test/install.test.mjs` proves an engine install produces a
byte-identical tree to `install.sh` (user scope), plus uninstall-purity, user-edit backup, and
project-scope config/git-hook coverage. Runs in CI on `node --test` (zero dependencies). The
shell installers remain the public `curl | bash` path until a compiled CLI binary ships; the
engine is verified to match them.
