# Cursor Subagent Internals — Validated Reference

A field-tested reference for Cursor's subagent system: **which model slugs actually
route, what silently breaks, and how hooks really behave** — verified against a specific
Cursor build, not guessed from the docs.

Cursor documents the *shape* of subagents ([cursor.com/docs/subagents](https://cursor.com/docs/subagents)).
This doc covers the parts it doesn't: the silent-fallback footgun, the hooks fail-open
default, and a slug list confirmed to route on a real build. Re-run the
[2-minute check](#2-minute-validation) after any Cursor update and update the matrix.

> **Last validated:** Cursor **3.8.23 (Universal)** · 2026-06-26
> Re-check [`cursor.com/changelog`](https://cursor.com/changelog) and the
> [models reference](https://cursor.com/docs/models-and-usage/available-models) before relying on the tables below.

---

## Compatibility matrix

| Capability | 3.8.23 | 3.9.8 | Notes |
| ---------- | :----: | :---: | ----- |
| Per-agent `model:` routing (frontmatter) | ✅ | ✅ | **Invalid slug silently downgrades** — see gotcha #1. All 8 agents verified routing on 3.9.8. |
| Subagent nesting depth | ✅ (2) | ✅ (2) | main + direct subagents can spawn; their children can't |
| `beforeShellExecution` hook (block/ask/allow) | ✅ | ✅ | **Fails open by default** — set `failClosed` — see gotcha #2. Blocks `rm -rf`/force-push on 3.9.8. |
| `afterFileEdit` hook | ✅ | ✅ | Fires on agent edit-tool writes (informational lint) |
| Commit anti-pattern guard (`as any`, `@ts-ignore`) | ✅ | ⚠️→✅ | On 3.9 the agent may commit via Cursor's **native git path**, which bypasses `beforeShellExecution`. **v0.4.1** adds a git `pre-commit` hook backstop that blocks the commit regardless of path. |
| `permissions.json` auto-review | ✅ | ⚠️→✅ | Best-effort classifier; on 3.9.8 it let `cat ~/.ssh/config` auto-run. **v0.4.1** enforces a deterministic credential-read **hold** in `guard-shell.sh`. |
| Automations (event-driven dispatch) | ⚠️ cloud-only | ⚠️ cloud-only | No committable config file yet — ships as paste-in `/automate` recipes |

Legend: ✅ works as configured · ⚠️ caveat · ⚠️→✅ caveat found on this version, fixed in the listed release · ❌ unavailable/blocked.

> **Cursor 3.9.8 E2E (2026-06-28):** **13/15**, then **15/15** after v0.4.1. The first run on a
> major-version bump surfaced two gaps the 3.8 validation couldn't — a native-path commit
> bypassing the shell commit-guard, and the auto-review classifier letting an SSH-config read
> through — both closed by the v0.4.1 git pre-commit backstop and the credential-read hold, then
> re-verified live (commit blocked; `cat ~/.ssh/config` held). Full runbook: [`docs/E2E-TEST.md`](docs/E2E-TEST.md).

---

## Validated Task-tool model slugs

The Task tool accepts **specific slugs only** — the README/orchestrator shorthand is not
valid. Omitting `model:` makes a subagent inherit its parent's model (`inherit`).

| Slug | Routes to | Used by |
| ---- | --------- | ------- |
| `composer-2.5-fast` | Composer 2.5 Fast (default pool) | Aang, Appa, Katara, Momo, Toph |
| `claude-opus-4-8-thinking-high` | Opus 4.8, high thinking | Sokka, Iroh |
| `gemini-3.1-pro` | Gemini 3.1 Pro | Zuko |
| `claude-4.6-opus-high-thinking` | Opus 4.6 thinking | (alt) |
| `claude-4.6-sonnet-medium-thinking` | Sonnet 4.6 thinking | (alt) |
| `claude-fable-5-thinking-high` | Fable 5 thinking | (alt) |
| `gpt-5.3-codex-high-fast` | GPT-5.3 Codex | (alt) |
| `gpt-5.5-medium` | GPT-5.5 | (alt) |
| `kimi-k2.5` | Kimi K2.5 | (alt) |

**Shorthand that does *not* work** (and silently downgrades):
`cursor-composer-2-5` → use `composer-2.5-fast`; `claude-opus-4.8` → use `claude-opus-4-8-thinking-high`;
`gemini-3.5-flash` was rejected — `gemini-3.1-pro` routes.

---

## Gotchas the docs don't tell you

**1. An invalid or stale slug silently downgrades to `composer-2.5-fast` — it does not error.**
Cursor's docs only mention fallback for plan/admin/Max-Mode reasons. In practice, a *typo
or outdated slug* falls through to the default Composer model with no warning. A wrong slug
"works" while quietly running the wrong (and often cheaper) model. This is the single most
important reason to validate routing after every update. In our first 8-agent sweep, 7/8
agents were on invalid slugs and all silently ran Composer 2.5 Fast — it looked like a
"subagent model lockdown" but was just wrong slugs.

**2. `beforeShellExecution` hooks fail *open* by default.**
A hook that fires but errors (bad PATH, parse failure) → Cursor **allows** the command. So
"nothing was blocked" does **not** mean "the hook never ran." Set `"failClosed": true` on
the hook entry so a script error denies instead of allowing.

**3. macOS GUI PATH doesn't include Homebrew.**
Cursor.app doesn't inherit your shell's `/opt/homebrew/bin`, so `jq`/`python3` can be absent
on the hook's PATH → the guard parses an empty command → silently allows. Resolve
interpreters at absolute paths (`/opt/homebrew/bin`, `/usr/bin`) with a `perl` fallback.

**4. Project hooks need a full restart, not a reload.**
`.cursor/hooks.json` registers only after a full **Cmd+Q + relaunch** (a window reload is
not enough) in a **trusted** workspace. Reloading the window leaves stale/no hooks.

**5. `.cursor/` is gitignored → fresh clones and cloud agents get no hooks.**
Hooks are per-machine via the installer by design. If cloud/fresh-clone agents must be
guarded, un-ignore and commit `.cursor/hooks*` with `--chmod=+x`.

**6. Hooks/auto-review are best-effort, not a security boundary.**
They cut footguns and approval spam; they don't replace real sandboxing.

---

## 2-minute validation

Run this after installing a new Cursor version or a new branch of this repo.

### Model routing (the critical test)

Paste into a fresh Cursor chat:

```text
You are Team Avatar. Dispatch @toph to list the files in this repo, @sokka to
outline a trivial plan, and @zuko to describe an icon. Do no work yourself.
```

For each subagent, read the **model badge** on its tab / run metadata and compare to the
[slug table](#validated-task-tool-model-slugs):

- ✅ All match their configured model → routing holds.
- ⚠️ A Composer agent runs but a non-Composer agent (Opus/Gemini) silently runs Composer →
  **wrong slug** (gotcha #1). Fix the slug; do not assume a lockdown.
- ❌ A non-Cursor model is *refused* → that model is plan/admin/Max-Mode restricted on your
  account. Switch that agent to an available slug.

### Orchestration smoke tests

- [ ] Root thread refuses to work directly and delegates via `Task`
- [ ] `/plan <ambiguous>` → Sokka asks a clarifying question before planning
- [ ] `/search <topic>` → Toph returns read-only findings
- [ ] `/build` after a plan → Aang/Appa implement and self-verify (lint/test)
- [ ] `/fix <bug>` → Katara makes a minimal change
- [ ] `/image <request>` → Zuko generates an asset into `assets/`
- [ ] `/cactus-juice <multi-part>` → multiple workers spawn in parallel

### Hooks (project-scope install only)

Instrumented repro:

```bash
launchctl setenv OMC_HOOKS_DEBUG 1     # macOS: log every invocation
bash install.sh --project --force
# → Cmd+Q + relaunch Cursor, trust the workspace
```

In the Agent chat, have it create + `git add` + `git commit` a `.ts` file containing
`as any`. Expect: **commit blocked** ("Command execution was blocked by a hook") and a
`git commit` line in `.cursor/hooks/last-invocation.log`. Cleanup: `launchctl unsetenv OMC_HOOKS_DEBUG`.

> **Observe mode:** set `OMC_HOOKS_OBSERVE=1` to run `guard-shell.sh` non-blocking — it logs
> what it *would* deny without denying, so you can validate before trusting it to block.

---

## Validation history

<details>
<summary><strong>Cursor 3.8.23 · 2026-06-24 — Model routing (§1)</strong></summary>

The first 8-agent sweep exposed that the `model:` slugs were **invalid**, so the Task tool
rejected 7/8 and Cursor fell back to its default subagent model (Composer 2.5 Fast). It was
never a "lockdown" — wrong slugs masquerading as one (Composer agents "passed" only because
the fallback is also Composer).

| Agent | Slug tried (invalid) | What ran |
| ----- | -------------------- | -------- |
| Aang, Appa, Katara, Momo, Toph | `cursor-composer-2-5` | Composer 2.5 Fast (fallback) |
| Sokka, Iroh | `claude-opus-4.8` | Composer 2.5 Fast (fallback) |
| Zuko | `gemini-3.1-pro` ✓ | Gemini 3.1 Pro |

**Re-run after slug fix — PASS:** all 8 dispatched, replied in character, and routed
correctly — Composer pool → Composer 2.5 Fast, Sokka/Iroh → Opus 4.8 High, Zuko → Gemini
3.1 Pro. Fixes applied: `cursor-composer-2-5` → `composer-2.5-fast`,
`claude-opus-4.8` → `claude-opus-4-8-thinking-high`.

</details>

<details>
<summary><strong>Cursor 3.8.23 · 2026-06-25/26 — Hooks &amp; auto-review (M1)</strong></summary>

**Run 1 (NOT-DENIED → diagnosed):** Codex drove Cursor to commit a `.ts` with `as any` and
the commit **succeeded** — both hooks silent. Adversarial diagnosis (a research synthesis
was overturned by its own verifier — keep the verifier):

1. `beforeShellExecution` **fails open** — a hook that errors → allow. So "both silent ⇒
   never registered" was a false inference.
2. **macOS GUI PATH bug** — Cursor.app lacks `/opt/homebrew/bin`, so `python3` could be
   absent → guard parsed an empty command → allowed.
3. **cwd mismatch** — the guard ran the check without `cd`-ing to the payload `cwd`, so
   `git diff --cached` saw an empty staged set → allowed.
4. **Registration** — project hooks need a full quit + relaunch and a trusted workspace.

**Hardening applied (re-tested ✓):** PATH-robust parsing (`jq` → absolute `python3` →
`perl`); `cd` into payload `cwd` before git checks; parse-failure returns **`ask`** not
silent-allow; `OMC_HOOKS_DEBUG=1` invocation log; `"failClosed": true`.

**Run 2 — PASS ✅:** after hardening + project-scope-only install + full Cmd+Q restart, the
agent's `as any` commit was **BLOCKED** and `last-invocation.log` recorded the `git commit`,
proving the guard fired and the deny was honored.

**All three layers PASS (2026-06-26):**
- [x] `beforeShellExecution` guard — `as any` commit blocked; guard fired.
- [x] `afterFileEdit` lint — agent edit logged an `edit` line → `post-edit-lint.sh` fired.
- [x] `permissions.json` auto-review — `git status` auto-ran while `cat ~/.ssh/config` was
      held for review (matches `block_instructions`).

**Known follow-ups:** Cursor shows its generic "blocked by a hook" text, not our
`userMessage` (cosmetic); unattended `codex exec` auto-denies the computer-use elicitation
(needs interactive Codex / pre-granted Automation); `.cursor/` gitignore means cloud agents
get no hooks (document or commit with `--chmod=+x`).

</details>

<details>
<summary><strong>External QA loop (Codex computer-use) — platform notes</strong></summary>

Codex acts as an **independent** visual QA tester (the model that wrote the code isn't the
one grading it): Cursor builds, Codex looks at the running UI and reports pass/fail with
screenshots, failures feed back via `/fix`.

Platform reality (verify against the Codex changelog before relying on it):
- **macOS** — Computer Use (Apr 2026); can run in the background. Best for an unattended loop.
- **Windows** — added ~May 2026, but takes over the active desktop.
- **Linux** — Computer Use not supported; use **browser use** against a local dev server.
- Recommended model: `gpt-5.5` (computer-use capable).

Open question: is Cursor 3.8's **native** computer-use automation good enough to replace the
external loop, or is the independent-tool check worth keeping?

**Full E2E runbook:** [`docs/E2E-TEST.md`](docs/E2E-TEST.md) is a paste-into-Codex driver that
drives the Cursor agent window through all 15 checks (model routing + hook enforcement +
auto-review) and fills in a pass/fail table. Run it attended.

</details>
