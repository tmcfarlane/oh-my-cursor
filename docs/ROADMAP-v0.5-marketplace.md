# oh-my-cursor v0.5+ — Behavior Pack Marketplace / Installer

> Vision: a **local-first marketplace/installer for Cursor behavior packs** — a coding-harness
> store for Cursor. Positioning: **"Install a coding harness for your agent."**
> This document is the implementation plan. It does not implement anything.

Snapshot: planned against the v0.4.2 codebase (June 2026, Cursor 3.9.8). Opinionated by design.

---

## 1. Current repo assessment

### Existing architecture
oh-my-cursor today is a **single-pack, dual-language shell installer**. There is no runtime in
the shipped artifact — the installed output is inert Cursor config (Markdown + JSON + shell):

- **The artifact** (`agents/*.md`, `rules/orchestrator.mdc`, `commands/*.md`, `hooks/*.sh`,
  `hooks.json`, `permissions.json`, `skills/*/SKILL.md`) — all Team Avatar, all hardcoded.
- **The installer** — `install.sh` (905 lines bash) and `install.ps1` (~35 KB PowerShell),
  maintained in lockstep. File sets are **hardcoded arrays** (`AGENT_FILES`, `SKILL_DIRS`,
  `LEGACY_AGENT_FILES`, …). Supports user/project scope, `--claude/--codex` mirroring,
  dry-run, force, uninstall, disable/enable, legacy migration.
- **Manifests** — `plugin.json` (Cursor plugin manifest) and `skills.json` (skill provenance)
  list the same files a third and fourth time.
- **Distribution** — `curl … | bash` / `irm … | iex`, sourcing files from GitHub raw or a
  local checkout.
- **Validation** — `VALIDATION.md` (model-slug sweep) + `docs/E2E-TEST.md` (Codex
  computer-use runbook, 15 checks). The signature gotcha: an invalid `model:` slug **silently
  downgrades** to `composer-2.5-fast` instead of erroring.

### Current strengths (preserve)
1. **Inert-artifact philosophy.** Installed output is plain Cursor config — no daemon, no
   wrapper CLI in the user's repo. This is the product's trust moat. Keep it absolute: the
   marketplace app is build/dev-time tooling; **what lands in `.cursor/` stays pure config.**
2. **Real enforcement layer.** `guard-shell.sh` (deny destructive cmds, block `as any`/
   `@ts-ignore` commits, hold credential reads), the git pre-commit backstop, and the tuned
   `permissions.json` auto-review policy are a genuine differentiator over "just some prompts."
3. **Model-slug rigor.** The silent-fallback discipline in `VALIDATION.md` is unique and
   valuable — it belongs in an automated validator.
4. **Idempotent, diff-aware install** (`cmp`/`diff` → unchanged/updated/skipped) and a clean
   dry-run. Good bones for a "preview before apply" UX.
5. **Cross-tool mirroring** (`.claude/`, `.codex/`) already proves the layout generalizes
   beyond Cursor.
6. **Team Avatar** is a polished flagship pack and a strong demo.

### Current gaps (the marketplace doesn't exist yet)
1. **One repo = one pack.** Everything is Team Avatar. No concept of *a pack* as a unit.
2. **No manifest-driven install.** The installer knows filenames, not packs. Adding a second
   pack means editing two installers' hardcoded arrays.
3. **No lockfile / transaction record.** Uninstall works off hardcoded arrays, so it can't
   know what an arbitrary pack installed. No upgrade/rollback safety, no user-edit detection.
4. **Logic duplicated 2× (bash + pwsh) and metadata duplicated 4×** (installer arrays,
   `plugin.json`, `skills.json`, README tables). This is the central maintenance tax and it
   gets quadratic as packs multiply.
5. **No engine, no CLI, no GUI.** Nothing to "browse," "preview," "validate," or "manage."
6. **No registry / index.** No machine-readable list of available packs.
7. **Validation is manual.** Slug checks and E2E are human-driven; nothing gates a bad pack.

### What should change
- Extract Team Avatar into a **self-describing pack**; make the installer **manifest-driven**.
- Replace hardcoded uninstall with a **lockfile**.
- Collapse the bash+pwsh logic into **one TypeScript engine**; reduce the shell scripts to thin
  bootstraps that fetch and run it.
- Make the repo a **registry of packs**, not a single pack.

---

## 2. Proposed product architecture

### Local app vs CLI vs web marketplace — the call
Build in this order, each layer reusing the one below:

1. **Engine (library)** — the brain. Pure, platform-agnostic, testable.
2. **CLI** — thin wrapper over the engine. Ships first real value, scriptable, CI-able.
3. **Desktop GUI (Tauri)** — the "marketplace" experience, sits on the engine.
4. **Web marketplace** — discovery/publishing only; never the install path. Last, optional.

**Local-first means the engine + CLI are the product; the web is just a catalog.** Installs
always run locally against a user-selected repo.

### Language/tooling decision (opinionated)
- **Engine + CLI: TypeScript**, compiled to a **single self-contained binary per platform**
  (Bun `--compile`, or `pkg`). Rationale: install logic is filesystem + JSON/Markdown
  templating + diffing — TS's sweet spot; the team is JS/TS-oriented; and it **eliminates the
  bash/pwsh lockstep** that will otherwise blow up with N packs. One source of truth.
- **Desktop: Tauri** (Rust shell + web UI). The Rust side does **only** window management,
  native file dialogs ("select repo"), "open in Cursor" deep-links, and process plumbing. It
  **invokes the TS engine as a bundled sidecar binary** over stdio/JSON-RPC. **Do not
  re-implement the engine in Rust** — that would recreate the duplication problem we're killing.
- **`install.sh` / `install.ps1` survive as ~30-line bootstraps**: detect platform, download
  the right engine binary (or `npx @oh-my-cursor/cli`), exec it. The famous one-liner keeps
  working; the 900-line bash brain retires.

### How packs are represented
A **pack is a directory** with a `pack.json` manifest at its root and a conventional layout
mirroring `.cursor/` (`agents/`, `rules/`, `commands/`, `hooks/`, `skills/`, `assets/`, plus
`permissions.json`/`hooks.json`). Packs are **composable**: a pack may `extends` a base pack and
`requires` others.

**Strong opinion — decouple capability from theme.** Two orthogonal axes:
- **Capability** = what agents *do* (Principal Engineer, API Architect, Security Reviewer,
  Frontend Builder, DX Regression Harness).
- **Theme** = the persona skin (Team Avatar, Fellowship, K-pop Demon Hunters).

Team Avatar = "full dev-team capability" + "ATLA theme." Model the manifest so a capability
bundle can carry an optional **theme overlay**, so one capability ships many skins and
fan-themed/copyright risk is isolated to overlays. **MVP packs may be monolithic** (capability
+ theme baked together), but the schema must reserve `theme`/`extends` for the split later.

---

## 3. Behavior pack spec (`pack.json`)

```jsonc
{
  "schemaVersion": 1,
  "id": "team-avatar",                  // unique, kebab-case, registry key
  "name": "Team Avatar",
  "version": "0.5.0",                   // semver; drives upgrades
  "description": "Avatar-themed 8-agent dev team with orchestrator + enforcement hooks.",
  "author": "ZeroClickDev",
  "license": "MIT",
  "homepage": "https://github.com/tmcfarlane/oh-my-cursor",

  "category": "team",                   // team | role | harness | theme
  "tags": ["orchestration", "atla", "full-team", "hooks"],
  "theme": {                            // optional persona overlay metadata
    "title": "Avatar: The Last Airbender",
    "fan": true,                        // flags IP/fan content (see §8)
    "assets": "assets/"
  },
  "capabilities": ["orchestrator", "multi-agent", "hook-enforcement"],

  "extends": null,                      // base pack id (composition)
  "requires": {                         // dependency + environment gates
    "cursor": ">=3.4",
    "packs": []
  },

  "models": {                           // every slug validated against the slug list (§7)
    "default": "composer-2.5-fast",
    "overrides": { "sokka": "claude-opus-4-8-thinking-high", "zuko": "gemini-3.1-pro" }
  },

  "contents": {                         // globs, relative to pack root → map to .cursor/*
    "agents":   ["agents/**/*.md"],
    "rules":    ["rules/*.mdc"],
    "commands": ["commands/*.md"],
    "hooks":    ["hooks/*.sh"],
    "skills":   ["skills/*"],
    "config":   ["permissions.json", "hooks.json"],
    "assets":   ["assets/**"]
  },

  "scopes": ["user", "project"],        // where install is allowed
  "tools":  ["cursor", "claude", "codex"], // mirror targets supported

  "permissions": {                      // trust surface, surfaced in CLI/GUI before apply
    "shellHooks": true,
    "gitHooks": true,                   // writes .git/hooks/pre-commit
    "network": false,
    "writes": ["${cursorDir}/**", "${gitDir}/hooks/pre-commit"]
  },

  "scripts": {                          // OPTIONAL, opt-in, shown + confirmed before running
    "postInstall": "scripts/post-install.sh",
    "validate":    "scripts/validate.sh",
    "preUninstall":"scripts/pre-uninstall.sh"
  },

  "activation": {                       // the manual-step story (see §8)
    "requiresAlwaysAllow": true,
    "requiresRestart": true,
    "steps": ["Open rules/orchestrator.mdc in Cursor → Always Allow", "Cmd+Q restart", "Trust workspace"]
  },

  "uninstall": {                        // paths outside the managed set
    "extraPaths": ["${gitDir}/hooks/pre-commit"]
  }
}
```

Field-by-field intent (vs the user's requested checklist):
- **Cursor rules / prompts / commands / hooks / skills / config / assets** → `contents.*` globs.
  The engine reads the globs, never a hardcoded filename list.
- **Install scripts / validation scripts** → `scripts.postInstall` / `scripts.validate`.
  **Default-off and confirmed**: arbitrary script execution is the #1 trust risk (§8); the
  engine never runs them silently and the GUI shows the full script before a single run.
- **Versioning** → `version` (semver) + `requires.cursor` + a recorded `validatedCursor` in the
  registry entry.
- **Dependencies** → `extends` (single base) + `requires.packs` (peer packs).
- **Permissions** → `permissions` block: declarative trust surface (does it ship shell hooks?
  git hooks? touch the network?), rendered as a badge/diff before apply.
- **Rollback / uninstall metadata** → global **lockfile** (below) + `uninstall.extraPaths` for
  out-of-tree artifacts (like the git pre-commit hook).

### Lockfile (the rollback/upgrade backbone)
On every apply the engine writes `${cursorDir}/.oh-my-cursor/lock.json`:

```jsonc
{
  "schemaVersion": 1,
  "installs": [{
    "packId": "team-avatar",
    "version": "0.5.0",
    "scope": "project",
    "installedAt": "2026-06-28T…",
    "files": [
      { "path": "agents/aang.md", "sha256": "…", "userModified": false }
    ],
    "extraPaths": [".git/hooks/pre-commit"]
  }]
}
```

This makes **uninstall exact** (remove what we wrote, nothing else), **upgrades safe** (diff old
vs new file sets; orphan-prune removed files), and **user edits detected** (sha mismatch → back
up to `*.omc-bak` and warn instead of clobbering). It retires every hardcoded uninstall array.

### Registry index (`registry/registry.json`)
```jsonc
{
  "schemaVersion": 1,
  "packs": [{
    "id": "team-avatar",
    "path": "packs/team-avatar",        // local path | git URL | (future) remote tarball
    "version": "0.5.0",
    "category": "team",
    "tags": ["orchestration", "atla"],
    "validatedCursor": "3.9.8",
    "summary": "8-agent Avatar dev team."
  }]
}
```
The repo *is* the default registry. Users can register additional local dirs or git URLs.
Web discovery (Phase 6) just serves a hosted `registry.json`.

---

## 4. MVP user flow

```
Browse → Select repo → Preview diff → Install → Validate → Activate → Open in Cursor → Manage
```

1. **Browse** packs (CLI: `omc list` / GUI gallery). Filter by category/tag. See trust badges
   (shell hooks? git hooks? fan-themed?) from `permissions`/`theme`.
2. **Select local repo** — native folder picker (GUI) or `--cwd` (CLI). Project scope default.
3. **Preview** the exact file diff (`omc install team-avatar --dry-run` → the existing diff
   engine, now per-pack). New / updated / unchanged / **user-modified-will-back-up**.
4. **Install** — engine applies, writes the lockfile. Optional `scripts.postInstall` shown +
   confirmed before running.
5. **Run validation** — `omc validate team-avatar`: manifest schema, slug check, file presence,
   hook shellcheck, idempotent re-apply = no-op (§7 Tier 1). Pass/fail report.
6. **Activate** — first-class screen/printout: "Open `rules/orchestrator.mdc` → Always Allow;
   Cmd+Q restart; trust workspace." The engine can't bypass this, so it *guides and verifies* it
   (§8). A post-activation smoke check confirms the rule is live.
7. **Open in Cursor** — deep-link / `cursor <repo>`.
8. **Manage** — `omc status` (installed packs, versions, drift), `omc upgrade`, `omc uninstall`,
   `omc disable/enable` (port the existing rule-toggle).

---

## 5. Technical implementation phases

**Phase 0 — Foundations / cleanup.** Monorepo skeleton (`packages/core`, `packages/cli`,
`packages/schema`, `packs/`, `registry/`). Author `pack.schema.json` + `registry.schema.json`.
Add the curated **valid-slug list** as data. Stand up CI (lint, typecheck, schema-validate,
unit). No behavior change to the shipped installer yet.

**Phase 1 — Pack format.** Extract Team Avatar into `packs/team-avatar/` with a real `pack.json`.
Make `plugin.json`/`skills.json` **generated from** the manifest (kill duplication). Ship the
schema + a `validate-pack` script. Acceptance: `team-avatar` validates green; its `pack.json`
fully describes the current install set.

**Phase 2 — Local installer (engine + CLI).** Build `@oh-my-cursor/core`: parse → validate →
**plan (diff)** → **apply** → **lockfile** → **uninstall/upgrade/rollback**. Build `omc`
(`list/info/install/uninstall/validate/status/upgrade/disable/enable`, `--dry-run`, `--scope`,
`--tools`). Re-point `install.sh`/`install.ps1` to bootstrap the CLI. **Behavior parity with
today's installer is the acceptance gate** (same files land, uninstall is now lockfile-exact).

**Phase 3 — Gallery UI (Tauri).** Desktop app over the engine sidecar: browse, repo picker,
diff preview, install, validate, manage, activation checklist. Frontend per the web-design
guidelines already vendored in this repo.

**Phase 4 — Validation harness.** Generalize `VALIDATION.md`/`E2E-TEST.md` into per-pack
validation: Tier 1 deterministic (CI gate), Tier 2 Cursor-UI smoke via Codex computer-use
(attended, per-pack expected-routing assertions), Tier 3 Claude Code for authoring (§7). Every
pack in the registry must pass Tier 1 in CI to be listed.

**Phase 5 — Publishing / discovery (still local-first).** `omc pack init` (scaffold), `omc pack
validate`, `omc pack publish` (PR into the registry, or push a git-URL pack). Add multi-registry
support (local dir / git URL). Community vs official registry split (§8).

**Phase 6 — Web marketplace (optional).** Static site serving the hosted `registry.json` +
rendered pack pages, with a "copy install command" / deep-link into the desktop app. **No
server-side install path.** Discovery only.

---

## 6. Target file/folder structure

```
oh-my-cursor/
├── packs/                              # the registry contents (one dir per pack)
│   ├── team-avatar/
│   │   ├── pack.json
│   │   ├── agents/ rules/ commands/ hooks/ skills/ assets/
│   │   ├── permissions.json  hooks.json
│   │   └── scripts/            # optional post-install / validate
│   ├── principal-engineer/
│   ├── api-architect/
│   ├── security-reviewer/
│   ├── frontend-builder/
│   ├── dx-regression-harness/
│   └── community/              # fan-themed overlays (fellowship, kpop-demon-hunters, …)
├── registry/
│   └── registry.json
├── packages/
│   ├── core/                   # @oh-my-cursor/core — engine (parse/validate/plan/apply/rollback)
│   │   ├── src/  test/
│   ├── cli/                    # omc CLI (thin over core), compiles to a binary
│   └── schema/                 # pack.schema.json, registry.schema.json, valid-slugs.json
├── apps/
│   └── desktop/                # Tauri app (Phase 3): src-tauri/ (Rust shell) + ui/ (web)
├── scripts/
│   ├── install.sh              # thin bootstrap → fetch & run CLI
│   └── install.ps1             # thin bootstrap (PowerShell)
├── docs/                       # roadmaps, VALIDATION, E2E
├── .github/workflows/          # CI: schema-validate, unit, pack Tier-1 gate
└── README.md
```

Migration note: keep top-level `agents/…` working until Phase 2 ships parity, then move them
under `packs/team-avatar/` in one cut and delete the legacy paths + hardcoded arrays.

---

## 7. Validation & DX-regression plan

Three tiers, three tools — matched to what each is good at:

**Tier 1 — Deterministic / scripted (CI + local, blocks merges).**
- `pack.json` validates against `pack.schema.json`; `registry.json` against its schema.
- **Model-slug check**: every slug in `models.*` ∈ curated `valid-slugs.json`. This is the
  silent-fallback gotcha, finally automated.
- File presence: every `contents` glob resolves to ≥1 file; agent frontmatter parses.
- Shell hooks pass `shellcheck`; `pwsh` bootstrap parses.
- **Idempotency**: apply twice into a temp dir → second run is all-`unchanged`.
- **Uninstall purity**: install then uninstall into a temp dir → tree is byte-identical to
  pre-install (lockfile correctness).
- Runs in `.github/workflows`; **a pack can't enter the registry without green Tier 1.**

**Tier 2 — Cursor-UI smoke (Codex computer-use, attended).** Generalize `docs/E2E-TEST.md` into
a per-pack runbook: assert model routing (the real model fired, not a silent downgrade), hook
enforcement (blocked `as any` commit, denied destructive cmd, held credential read), and
auto-review holds. Paste the pack's Driver Prompt into Codex with Computer Use → it fills a
pass/fail table against the live Cursor app. Required before a pack is marked `validated` in the
registry.

**Tier 3 — Claude Code (authoring & implementation).** Build the engine/CLI/Tauri app and scaffold
new packs via Claude Code (this repo already runs the OMC layer). Use it for plan→implement→
review on each phase; use the vendored skills for the GUI work.

**DX-regression harness** is itself a shippable pack (`dx-regression-harness`): a bundle of
rules/hooks/commands that asserts a target repo's agent DX hasn't regressed (lint/build/test
gates, routing assertions) — dogfooding the format and giving the marketplace a non-themed,
purely-functional flagship alongside Team Avatar.

---

## 8. Risks & tradeoffs

| Risk | Stance / mitigation |
| --- | --- |
| **Cursor "Always Allow" + restart prompts** (orchestrator rule, project hooks) | Can't be bypassed — make it a **first-class Activation step**: explicit checklist, deep-link to the file, and a post-activation **smoke check** that detects whether the rule/hooks are live. Default MVP to **project scope** (hooks + rules are project-scoped) and document the Cmd+Q restart + trust requirement. Never claim activation succeeded without verifying. |
| **Local filesystem safety** | Engine writes **only** inside the selected `${cursorDir}` (+ declared `extraPaths`). Every write goes through the diff/lockfile path; user-modified files are **backed up (`*.omc-bak`)**, never silently clobbered. Hard refuse paths outside the managed set. |
| **Arbitrary script execution** (`scripts.postInstall`) | The single biggest trust hole. **Default-off, never silent.** The engine prints the full script and requires explicit confirmation; the GUI shows source + a "no-scripts" install mode. Official-registry packs with scripts get extra review. |
| **Pack trust / security** | `permissions` block is a declarative trust surface rendered before apply (shell hooks / git hooks / network badges). Official registry = reviewed + Tier-1-gated + signed manifests (checksum in `registry.json`); community/git-URL packs carry an "unverified" badge. |
| **Copyrighted / fan-themed packs** (ATLA, LOTR, K-pop Demon Hunters) | Keep IP in **theme overlays**, not capabilities. Official registry ships **original-art / text-only** personas; fan packs live under `community/` (or a separate community registry) with a parody/transformative disclaimer and `theme.fan: true`. No copyrighted binary assets in the default-distributed set. Revisit before any hosted/monetized marketplace. |
| **Cross-platform** | One TS engine + per-platform compiled binary removes bash/pwsh drift. Tauri covers macOS/Windows/Linux. Path handling, line endings, and `chmod +x` on hooks are explicit engine concerns with tests. |
| **Install rollback** | Lockfile makes uninstall/upgrade exact and reversible; backups cover user-edited files; `uninstall.extraPaths` covers out-of-tree artifacts (git hook). Upgrades orphan-prune files dropped between versions. |
| **Engine vs artifact creep** | Guardrail: the installed artifact stays inert config forever. If a pack ever needs a runtime, that's a red flag — reject it. The moat is "no daemon in your repo." |

---

## 9. First 10 concrete tasks (→ GitHub issues)

1. **Author `pack.schema.json` + `registry.schema.json`** (`packages/schema/`) encoding §3.
   Include `models`, `contents` globs, `permissions`, `scripts`, `activation`, `uninstall`.
2. **Add `packages/schema/valid-slugs.json`** — the curated Cursor model-slug allowlist from
   `VALIDATION.md`, plus a tiny `validate-slugs` script. Wire into CI.
3. **Write `packs/team-avatar/pack.json`** describing the *current* Team Avatar install set
   (referencing existing top-level paths for now) and validate it against the schema.
4. **CI: schema + slug validation workflow** (`.github/workflows/validate-packs.yml`) — fails
   on invalid `pack.json` or unknown slug. Gate on this before listing any pack.
5. **Generate `plugin.json` + `skills.json` from `pack.json`** (script + check that the
   committed files match generated output) — kill the 4× metadata duplication.
6. **Scaffold `packages/core`** with the type model + `parsePack`, `validatePack`,
   `planInstall` (diff), returning a structured plan. Unit tests on a fixture pack.
7. **Implement `applyInstall` + lockfile** (`lock.json`) in core: write files, record
   sha256s, back up user-modified files. Round-trip test (apply → lock → uninstall = clean).
8. **Build `omc` CLI** (`packages/cli`) exposing `list/info/install/uninstall/validate/status
   /dry-run` over core. Parity test against current `install.sh` output for Team Avatar.
9. **Re-point `install.sh`/`install.ps1` to bootstrap the CLI** (download/exec the binary or
   `npx`), preserving the existing one-liner and flags. Keep legacy path behind a fallback.
10. **Author a second, non-themed pack** (`packs/principal-engineer/` or
    `dx-regression-harness/`) end-to-end through the new format — proves the format generalizes
    beyond Team Avatar and gives the gallery a second tile.

---

## 10. Recommended first PR (smallest valuable)

**PR: "Introduce the pack format — `pack.json` schema + Team Avatar manifest + CI validation."**

Scope (additive only, zero install-behavior change):
- `packages/schema/pack.schema.json`, `registry/registry.schema.json`,
  `packages/schema/valid-slugs.json` (slugs lifted from `VALIDATION.md`).
- `packs/team-avatar/pack.json` — fully describes the existing install set via `contents`
  globs that point at the current top-level `agents/`, `rules/`, etc. (no files moved yet).
- `registry/registry.json` — a registry-of-one listing `team-avatar`.
- `.github/workflows/validate-packs.yml` — validates `pack.json`/`registry.json` against the
  schemas and asserts every `models.*` slug ∈ `valid-slugs.json`. **Red on a stale/typo slug.**
- A short `docs/PACK-FORMAT.md` documenting the manifest.

Why this PR first: it establishes the contract everything else depends on, ships immediate value
(the slug-validation gate that today is a manual `VALIDATION.md` chore), moves nothing and breaks
nothing (the shell installer is untouched), and turns "one repo = one pack" into "this repo is a
registry whose first pack is Team Avatar." Every later phase — engine, CLI, GUI — consumes this
manifest.

**Explicitly not in the first PR:** the engine, the CLI, moving Team Avatar's files, touching
`install.sh`. Those are Phase 2 and follow once the format is locked.
```