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
- [ ] oh-my-cursor installed from **this branch** (not the published `main`):
      ```bash
      git clone -b claude/agent-harness-next-version-x6sx5i https://github.com/tmcfarlane/oh-my-cursor.git
      cd oh-my-cursor && bash install.sh --force
      ```
- [ ] Open `~/.cursor/rules/orchestrator.mdc` and click **"Always Allow"** when prompted

---

## 1. Model routing (the critical test)

**Goal:** confirm each agent's frontmatter `model:` string actually resolves and is the
model that runs — not silently downgraded.

For each agent, dispatch it and inspect which model the subagent thread reports in
Cursor's UI (the model badge on the subagent tab / the run metadata).

| Agent  | Frontmatter model     | Expected model in UI | Actually ran on | Pass? |
| ------ | --------------------- | -------------------- | --------------- | ----- |
| Aang   | `cursor-composer-2-5` | Composer 2.5         |                 | ☐     |
| Appa   | `cursor-composer-2-5` | Composer 2.5         |                 | ☐     |
| Katara | `cursor-composer-2-5` | Composer 2.5         |                 | ☐     |
| Momo   | `cursor-composer-2-5` | Composer 2.5         |                 | ☐     |
| Toph   | `cursor-composer-2-5` | Composer 2.5         |                 | ☐     |
| Sokka  | `claude-opus-4.8`     | Claude Opus 4.8      |                 | ☐     |
| Iroh   | `claude-opus-4.8`     | Claude Opus 4.8      |                 | ☐     |
| Zuko   | `gemini-3.5-flash`    | Gemini 3.5 Flash     |                 | ☐     |

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

Open questions to settle while you're here:
- [ ] Is the default alias `cursor-composer-2-5`, or does the picker want `composer-2.5`
      / `composer-2.5-fast`? Note the string that actually routes: `______________`
- [ ] Does a max-thinking / extended-thinking variant of Opus 4.8 exist for Sokka/Iroh?
      If so, note the exact string: `______________`
- [ ] **Zuko is on `gemini-3.5-flash` (fast/cheap tier).** For a visual/design agent you
      may want `gemini-3.x-pro` instead. Decide after seeing image/mockup quality: `______________`

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

Fill in after a run so the next version is built on facts, not assumptions:

- Cursor version tested: `__________`
- Custom model aliases route correctly? **yes / partial / no**
- If partial/no, which agents were forced to which model: `__________`
- Picker default fast model string: `__________`
- Zuko: keep Flash or move to Pro? `__________`
- Codex Computer Use platform used: `__________`
- Features from §3 confirmed available: `__________`
- **Recommended next step:** `__________`
