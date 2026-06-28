# Changelog

All notable changes to oh-my-cursor are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); this project uses [SemVer](https://semver.org/).

> **Validated against Cursor 3.9.8** (latest) — every release is verified on a real
> Cursor build before tagging. See [`VALIDATION.md`](VALIDATION.md) for the per-version
> compatibility matrix and the 2-minute re-validation check.

## [0.4.2] — 2026-06-28

**Validated against:** Cursor 3.9.8 ([reference](VALIDATION.md))

### Fixed
- **`install.ps1` git pre-commit hook could write to the wrong directory.** The v0.4.1 installer
  detected the hook path with PowerShell cmdlets (location-aware) but wrote it via
  `[IO.File]::WriteAllText`, which resolves relative paths against .NET's `CurrentDirectory` —
  not PowerShell's location. When those diverged, the hook landed in the wrong place. Now resolves
  an absolute git dir (`git rev-parse --absolute-git-dir`) so the write is cwd-independent;
  mirrored in `install.sh` for parity. Verified on **PowerShell 7.6.3** (install / idempotent
  re-install / skip-existing-non-OMC / dry-run / LF-only endings).

## [0.4.1] — 2026-06-28

**Validated against:** Cursor 3.9.8 ([reference](VALIDATION.md))

Hardening from the first end-to-end run on **Cursor 3.9.8** (13/15 → 15/15 after these fixes).
A major-version bump surfaced two gaps the earlier 3.8 validation couldn't: the agent can commit
through Cursor's **native git path** (bypassing the `beforeShellExecution` commit guard), and the
auto-review classifier let a credential read run unprompted.

### Added
- **Git `pre-commit` hook backstop** — `install.sh`/`install.ps1` (project scope) install a real
  git `pre-commit` hook running `pre-commit-check.sh`, so anti-pattern commits (`as any`,
  `@ts-ignore`, empty catches) are blocked **regardless of how the commit is made** — shell, git
  CLI, or Cursor's native git path. `beforeShellExecution` only sees shell commits.
- **Deterministic credential-read hold** — `guard-shell.sh` now holds (asks approval) on reads of
  credential/secret files (`~/.ssh/*`, `~/.aws/*`, `*.pem`, `id_rsa`, `.netrc`, kubeconfig, …)
  instead of trusting the best-effort auto-review classifier.

### Notes
- Existing non-OMC `.git/hooks/pre-commit` hooks are left untouched (install skips them).
- Re-verified live on 3.9.8: the `as any` commit is blocked and `cat ~/.ssh/config` is held.

## [0.4.0] — 2026-06-26

**Validated against:** Cursor 3.8.23 ([reference](VALIDATION.md))

Enforcement + automation. Hooks and an auto-review policy turn the orchestrator's hard
constraints into enforced behavior; automation recipes wire Team Avatar to real-world events.
Validated live on **Cursor 3.8.23**.

### Added
- **`.cursor/hooks.json` enforcement** — `beforeShellExecution` guard (`guard-shell.sh`)
  blocks destructive commands (`rm -rf /`, force-push to `main`, hard resets) and commits
  containing anti-patterns (`as any`, `@ts-ignore`, empty catches); `afterFileEdit` runs
  lints. `failClosed: true` so a hook error denies. **Validated:** an agent's `as any` commit
  is blocked. *(Project-scope install; requires a full Cursor restart to register.)*
- **`permissions.json` auto-review policy** — auto-runs safe calls (lints/tests/builds,
  read-only git); holds destructive/credential/network calls. **Validated:** `git status`
  auto-ran while `cat ~/.ssh/config` was held for review.
- **Automation recipes** (`automations/`) — ready-to-paste `/automate` prompts for Cursor
  Automations: PR review comment → Katara, issue `design` label → Zuko (webhook), Slack emoji
  → routed dispatch. Cursor automations are cloud-only, so these ship as recipes, not config.
- **Windows parity** — `install.ps1` installs the hooks/auto-review config (project scope).

### Notes
- Hook config is **project-scoped only** (`install.sh --project`); command paths are
  workspace-relative. Hooks/scripts are PATH-robust (don't assume `python3`/`jq` on the GUI
  app PATH) and `cd` into the payload `cwd` before git checks.
- `.cursor/` is gitignored, so cloud automation agents don't get the local hooks; recipe
  prompts carry their own guardrails.

## [0.3.0] — 2026-06-24

**Validated against:** Cursor 3.8.23 ([reference](VALIDATION.md))

Validated model refresh for the current Cursor roster, verified live on **Cursor 3.8.23**.

### Fixed
- **Model slugs corrected to valid Cursor Task identifiers.** Cursor's Task tool silently
  falls back to `composer-2.5-fast` when a `model:` slug is unrecognized, which looked like
  a "subagents are locked to Composer" bug. Replaced the invalid shorthands:
  - `cursor-composer-2-5` → `composer-2.5-fast` (Aang, Appa, Katara, Momo, Toph)
  - `claude-opus-4.8` → `claude-opus-4-8-thinking-high` (Sokka, Iroh)
- **Zuko** reverted from `gemini-3.5-flash` (did not route; fell back to Gemini 3.1 Pro) to
  `gemini-3.1-pro` — a valid slug and the stronger tier for visual work.

### Changed
- Sokka & Iroh upgraded to Opus 4.8 (high thinking) from the prior 4.7 alias.
- README model policy, agent cards, orchestrator routing table, and the debugging skill
  updated to the verified slugs; version labels moved to **Cursor 3.4+**.

### Added
- **`VALIDATION.md`** — a Cursor Pro validation guide: model-routing checks, orchestration
  smoke tests, a Cursor 3.6–3.8 feature inventory, the valid-slug reference table, and a
  **Codex computer-vision loop** that drives the Cursor agent window to confirm routing.
- Verified on Cursor 3.8.23: all 8 agents dispatch and route to their configured models.

## [0.2.0] — 2026-04

- Composer 2 / 2.5 migration for the default agent pool.
- Sokka & Iroh on Opus-tier reasoning; Zuko on the multimodal stack.
- Removed `is_background` from Toph for reliable output handoff.
- 8 agents, 9 slash commands, orchestrator rule, hooks, and bundled skills.

[0.4.0]: https://github.com/tmcfarlane/oh-my-cursor/releases/tag/v0.4.0
[0.3.0]: https://github.com/tmcfarlane/oh-my-cursor/releases/tag/v0.3.0
[0.2.0]: https://github.com/tmcfarlane/oh-my-cursor/releases/tag/v0.2.0
