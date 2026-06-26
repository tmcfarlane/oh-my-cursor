# Validation Guide

A hands-on checklist to run **once you have a Cursor Pro plan**, before trusting the
next version of oh-my-cursor. It exists because two things move faster than this repo:

1. **Cursor's model roster** — names and availability change almost monthly.
2. **Cursor's subagent model controls** — recent releases have tightened how (and
   whether) a `model:` string in agent frontmatter actually routes. Several builds
   have been reported to silently force subagents onto Composer, ignore
   `model: inherit` (falling back to `composer-1`), or whitelist only a single
   Composer variant for the `Task` tool.

If per-agent routing has been locked down in your build, the headline feature of this
project ("undocumented custom model aliases") may no longer hold — so **validate first,
build second.**

> Snapshot date: **June 2026**. Cursor 3.8 is current; Composer 3 is announced but not
> yet in the picker. Re-check [`cursor.com/changelog`](https://cursor.com/changelog) and
> the [available-models docs](https://cursor.com/docs/models-and-usage/available-models)
> before you start — update the tables below if the roster has shifted.

---

## 0. Prerequisites

- [ ] Cursor Pro active (agent mode + subagents enabled)
- [ ] Cursor updated to the latest version — note it here: `Cursor v________`
- [ ] oh-my-cursor installed from **the branch/tag you’re validating** (not the published `main`):
      ```bash
      git clone https://github.com/tmcfarlane/oh-my-cursor.git
      cd oh-my-cursor
      git checkout <branch-or-tag-under-test>
      bash install.sh --force
      ```
- [ ] Open `~/.cursor/rules/orchestrator.mdc` and click **"Always Allow"** when prompted

---

## 1. Model routing (the critical test)

**Goal:** confirm each agent's frontmatter `model:` string actually resolves and is the
model that runs — not silently downgraded.

For each agent, dispatch it and inspect which model the subagent thread reports in
Cursor's UI (the model badge on the subagent tab / the run metadata).

What the full 8-agent sweep (dispatched as Task subagents) actually exposed: the
`model:` slugs were **invalid**, so the Task tool rejected 7 of 8 and Cursor fell back to
its default subagent model — *Composer 2.5 Fast*. It was **never a subagent "lockdown"**;
it was wrong slugs masquerading as one (and the Composer agents "passed" only because the
fallback happens to be Composer too).

| Agent  | Slug tried (invalid)  | Valid? | What ran            |
| ------ | --------------------- | ------ | ------------------- |
| Aang   | `cursor-composer-2-5` | ✗      | Composer 2.5 Fast (fallback) |
| Appa   | `cursor-composer-2-5` | ✗      | Composer 2.5 Fast (fallback) |
| Katara | `cursor-composer-2-5` | ✗      | Composer 2.5 Fast (fallback) |
| Momo   | `cursor-composer-2-5` | ✗      | Composer 2.5 Fast (fallback) |
| Toph   | `cursor-composer-2-5` | ✗      | Composer 2.5 Fast (fallback) |
| Sokka  | `claude-opus-4.8`     | ✗      | Composer 2.5 Fast (fallback) |
| Iroh   | `claude-opus-4.8`     | ✗      | Composer 2.5 Fast (fallback) |
| Zuko   | `gemini-3.1-pro`      | ✓      | Gemini 3.1 Pro      |

### Valid Task-tool model slugs (Cursor 3.8.23, 2026-06-24)

The Task tool only accepts specific slugs; the README/orchestrator shorthand is **not**
valid. Omitting `model:` makes a subagent inherit the parent's model.

| Slug                            | Role |
| ------------------------------- | ---- |
| `composer-2.5-fast`             | Default executor pool (Aang, Appa, Katara, Momo, Toph) |
| `claude-opus-4-8-thinking-high` | Deep planning / docs (Sokka, Iroh) |
| `gemini-3.1-pro`                | Multimodal / visual (Zuko) |
| `claude-4.6-opus-high-thinking` | Opus-tier thinking (alt) |
| `claude-4.6-sonnet-medium-thinking` | Sonnet-tier thinking |
| `claude-fable-5-thinking-high`  | Fable thinking |
| `gpt-5.3-codex-high-fast`       | Codex fast |
| `gpt-5.5-medium`                | GPT medium |
| `kimi-k2.5`                     | Kimi |

Shorthand → valid slug fixes applied to this branch:
`cursor-composer-2-5` → `composer-2.5-fast`; `claude-opus-4.8` → `claude-opus-4-8-thinking-high`.

> **Status:** slugs corrected in all agent frontmatter, orchestrator, README, and the
> debugging skill. The project's per-agent routing premise holds — it just needs the
> correct slugs.
>
> **Re-run (2026-06-24, post-slug-fix, via Codex) — CONFIRMED PASS:** all 8 agents
> dispatched, replied in-character with no refusals, and route to their configured models:
>
> | Agent | Slug | Verified routing |
> | ----- | ---- | ---------------- |
> | Toph, Momo, Appa, Katara, Aang | `composer-2.5-fast` | Composer 2.5 Fast ✅ |
> | Sokka, Iroh | `claude-opus-4-8-thinking-high` | Opus 4.8 High ✅ |
> | Zuko | `gemini-3.1-pro` | Gemini 3.1 Pro ✅ |
>
> §1 is fully green: per-agent model routing works on Cursor 3.8.23 with the correct
> Task-tool slugs.

Quick dispatch prompt (run in a fresh Cursor chat):

```text
You are Team Avatar. Dispatch @toph to list the files in this repo, @sokka to
outline a trivial plan, and @zuko to describe an icon. Do no work yourself.
```

**Decision rules:**
- ✅ All match → custom aliases still route. Proceed; the README claim holds.
- ⚠️ Composer agents downgrade to `composer-1` or a generic Composer → frontmatter
  routing is being ignored. Note it and move heavy agents to the **picker-default**
  model instead of relying on the alias.
- ❌ Non-Cursor models (Opus/Gemini) are refused or swapped for Composer → subagent
  model choice is locked in your build. **This is the finding that decides the next
  version's architecture** — record it and stop before the feature work.

Open questions — status after the 3.8.23 runs:
- [x] Root cause of the Composer downgrade = **invalid slugs**, not a subagent lockdown.
      Cursor falls back to `composer-2.5-fast` when a `model:` slug is unrecognized.
- [x] Correct slugs identified and applied (see table above).
- [x] `gemini-3.1-pro` is valid and routes correctly for Zuko (`gemini-3.5-flash` did not).
- [x] **Re-run confirmed:** with the corrected slugs all 8 route correctly — Composer pool
      → Composer 2.5 Fast, Sokka/Iroh → Opus 4.8 High, Zuko → Gemini 3.1 Pro. §1 green.

---

## 2. Orchestration smoke tests

Confirm the harness behaves, independent of models.

- [ ] Root thread refuses to do work directly and delegates via `Task` (orchestrator rule active)
- [ ] `/plan <something ambiguous>` → Sokka asks a clarifying question before planning
- [ ] `/search <topic>` → Toph runs and returns findings (read-only)
- [ ] `/build` after a plan → Aang/Appa implement and self-verify (lint/test)
- [ ] `/fix <bug>` → Katara makes a minimal change
- [ ] `/image <request>` → Zuko generates an asset into `assets/`
- [ ] `/cactus-juice <multi-part task>` → multiple workers spawn in parallel
- [ ] Hooks fire: `post-edit-lint.sh` runs after an edit; `pre-commit-check.sh` blocks a commit containing `as any`

---

## 3. Cursor 3.x feature inventory (decides what to build next)

Confirm which new capabilities your plan actually exposes, so the next version targets
real features. Check each and note availability.

| Feature (Cursor 3.6–3.8) | Available on Pro? | Notes / how we'd use it |
| ------------------------ | ----------------- | ----------------------- |
| **Deep subagent nesting** (SDK, any depth) | ☐ | Harness currently caps depth at 2 by design — relax if useful |
| **`/automate` skill** (plain-language automation setup) | ☐ | Could auto-wire Team Avatar workflows |
| **Automations + triggers** (GitHub, Slack emoji) | ☐ | Event-driven dispatch |
| **Computer use in automations** (on by default) | ☐ | Native visual self-verification — may replace external Codex loop |
| **Auto-review** (route local tool calls through review) | ☐ | Quality gate before commit |
| **Composer 2.5** as picker default | ☐ | Confirm it's the default fast tier |
| **Composer 3** | ☐ | Expected later — not in picker as of June 2026 |
| **Hooks** (`.cursor/hooks.json`, stdio JSON) | ☐ | Current hooks are shell; SDK hooks are richer |

Anything checked here is a candidate for the **"adopt new Cursor features"** deliverable
that follows this model refresh.

---

## 4. Codex computer-vision validation loop

**Role:** Codex is the **external QA tester** of features the Cursor harness builds — an
independent second tool that visually verifies the result, so the model that wrote the
code isn't the one grading it. Cursor builds; Codex looks at the running UI and reports.

### Platform reality check (verify against the Codex changelog before relying on this)

- **macOS:** Computer Use launched Apr 16 2026; can run in the **background** (briefly
  unlocks the display during active turns). Best target for an unattended loop.
- **Windows:** support reportedly added ~May 29 2026, but the agent **takes over the
  active desktop** — you can't use the machine while it runs.
- **Linux:** Computer Use **not yet supported**. Use **browser use** against a local dev
  server as the fallback.
- **Recommended model:** `gpt-5.5` (computer-use capable).

### Setup

- [ ] Install Codex CLI/app and sign in (or set an API key for headless runs)
- [ ] Confirm Computer Use is available on your OS (note: `macOS` / `Windows` / `Linux→browser-only`)
- [ ] Decide the surface to test: a desktop app window (Computer Use) **or** a local web
      preview (browser use)

### Loop

1. Cursor (Team Avatar) builds or changes a UI feature on this branch.
2. Run Codex against the running app with a verification prompt, e.g.:
   ```text
   Open the app at http://localhost:3000 (or the running window). Verify:
   <acceptance criteria>. Take a screenshot of each step. If anything fails,
   describe exactly what you see vs. what was expected.
   ```
3. Codex screenshots, clicks/types, and reports pass/fail with visual evidence.
4. Feed failures back to Cursor (e.g. via `/fix`) and repeat until green.

- [ ] One full Cursor-build → Codex-verify → Cursor-fix cycle completed on a sample feature
- [ ] Screenshots captured as artifacts
- [ ] Decide: is the **native** Cursor 3.8 computer-use automation (§3) good enough to
      replace this external loop, or is the independent-tool check worth keeping?

---

## Results summary

First run recorded below; re-run and append as the roster shifts.

- Cursor version tested: `3.8.23 (Universal)` — 2026-06-24
- Custom model aliases route correctly? **yes, with the correct slugs** — the earlier
  "downgrade to Composer" was invalid slugs falling back, not a subagent lockdown
- Root cause found: `cursor-composer-2-5` and `claude-opus-4.8` are not valid Task slugs;
  Cursor falls back to `composer-2.5-fast`. Valid slugs now applied (see §1 table)
- Correct slugs: `composer-2.5-fast` (pool) · `claude-opus-4-8-thinking-high` (Sokka/Iroh) · `gemini-3.1-pro` (Zuko)
- Codex Computer Use platform used: `macOS (Codex.app 26.616.81150, gpt-5.5); needed Screen Recording + Accessibility + per-app Allow`
- Features from §3 confirmed available: `(pending)`
- §1 verdict: **PASS (confirmed)** — all 8 agents route to configured models on 3.8.23
- **Recommended next step:** `open PR -> main; then §3 Cursor 3.6-3.8 feature inventory for the version after`

---

## M1 (v0.4) — Hooks & Auto-review validation

### Run 1 (2026-06-25, Cursor 3.8.23, via Codex) — NOT-DENIED → fixed

Codex drove Cursor's agent to commit a `.ts` file containing `as any`. **The commit
succeeded (`b077d4b`)** — no "Blocked by oh-my-cursor", no approval prompt, and the only
lint seen was Cursor's built-in ReadLints (not our `post-edit-lint.sh`). Both hooks were
silent. Our scripts were proven correct in isolation, so this is an **integration/robustness
failure**, surfaced exactly as observe-first validation intends.

Adversarial diagnosis (a research synthesis was *overturned* by its own verifier — keep the
verifier):
1. **`beforeShellExecution` fails OPEN by default.** A hook that fires but errors → Cursor
   allows. So "both silent ⇒ never registered" was a false inference.
2. **macOS GUI PATH bug (real):** Cursor.app doesn't inherit the shell's `/opt/homebrew/bin`,
   so `python3` could be absent on the hook's PATH → guard parsed an empty command →
   silently allowed even when fired.
3. **cwd mismatch (real):** the guard ran `pre-commit-check.sh` without `cd`-ing to the
   payload `cwd`, so `git diff --cached` could see an empty staged set → allow.
4. **Registration:** project hooks may need a full **quit + relaunch** (not just Reload
   Window) and a **trusted workspace** to register on 3.8.x.

### Hardening applied this branch (re-tested locally ✓)
- PATH-robust JSON parsing: `jq` → `python3` at absolute paths (`/opt/homebrew`, `/usr/bin`,
  …) → `/usr/bin/perl`. Verified denies `rm -rf /` and commit-`as any` with PATH=`/usr/bin:/bin`.
- `cd` into the payload `cwd` before git checks (verified: detects staged `as any` in a
  separate worktree).
- Parse-failure now returns **`ask`** (surface), not silent allow.
- `OMC_HOOKS_DEBUG=1` → appends each invocation to `.cursor/hooks/last-invocation.log`.
- `"failClosed": true` on the `beforeShellExecution` entry so a script error **denies**.

### Run 2 (2026-06-26, Cursor 3.8.23) — PASS ✅

After: (a) hardening the scripts, (b) removing the stale user-scope hooks (project scope
only), and (c) a **full Cmd+Q restart** (not just reload), the Cursor agent was asked to
create `omc-hooktest.ts` (`as any`), `git add`, then `git commit`:
- **The commit was BLOCKED** — Cursor returned *"Command execution was blocked by a hook"*
  and **no "hook test" commit landed** (branch HEAD stayed at the prior commit).
- `last-invocation.log` (via `OMC_HOOKS_DEBUG=1`) recorded **every** shell command including
  the `git commit` — proving `guard-shell.sh` fired on `beforeShellExecution` and the deny
  was honored.

So `beforeShellExecution` enforcement works on 3.8.23 with: project-scope install + valid
slugs of the config + a **full restart**. The earlier NOT-DENIED was the fail-open bug, now fixed.

How to reproduce (instrumented): `launchctl setenv OMC_HOOKS_DEBUG 1` → `bash install.sh
--project --force` → **Cmd+Q + relaunch** → in the Agent chat have it create+add+commit an
`as any` `.ts` via the terminal → expect the commit blocked + a `git commit` line in
`.cursor/hooks/last-invocation.log`. Cleanup: `launchctl unsetenv OMC_HOOKS_DEBUG`.

### M1 status: all three layers PASS ✅ (2026-06-26, Cursor 3.8.23)
- [x] **`beforeShellExecution` guard** — commit of `as any` blocked; guard fired (Run 2).
- [x] **`afterFileEdit` lint hook** — agent edit-tool write of `scratch-edit-test.ts` logged an
      `edit` line → `post-edit-lint.sh` fired.
- [x] **`permissions.json` auto-review** — with Run Mode = Auto-review, `git status` auto-ran
      (no prompt) while `cat ~/.ssh/config` was **held for review** (matches `block_instructions`).
      Clean separation: guard blocks destructive/anti-pattern; auto-review holds broader risk.

### Cosmetic / follow-ups (non-blocking)
- [ ] Cursor showed its **generic** "blocked by a hook" text, not our `userMessage`
      ("Blocked by oh-my-cursor: …"). Confirm where our message surfaces (agent narration) — cosmetic.
- [ ] Driving this unattended via `codex exec` is **not possible** (auto-denies the computer-use
      elicitation). Automated Codex→Cursor QA needs the Codex app / interactive `codex`, or
      pre-granted Automation. Folds into M3.

### Known follow-ups before v0.4 release
- [ ] **`install.ps1` parity** — mirror `hooks.json` / `permissions.json` install on Windows.
- [ ] **`.cursor/` is gitignored** → committed hooks aren't shared, so **cloud/fresh-clone
      agents get NO hooks**. By design for the per-machine installer; document it (or un-ignore
      + commit `.cursor/hooks*` with `--chmod=+x` if cloud agents must be supported).
- [x] User-scope path resolution: **resolved** — hook config is now project-scope only
      (installer skips `hooks.json`/`permissions.json` at user scope; relative command paths
      only resolve in a project workspace). Confirmed on 3.8.23 that BOTH user & project
      hooks register in the Hooks panel, so Run 1's failure was fail-open, not registration.
- [ ] If `subagentStart` exists in your build, add an allowlist/depth-cap enforcement hook.
