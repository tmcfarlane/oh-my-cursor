# v0.4 Scoping — Adopting Cursor 3.6–3.8 Features

Status: **DRAFT / scoping.** Each item must pass a Cursor Pro validation (per `VALIDATION.md`)
before it ships. Snapshot: June 2026, Cursor 3.8.23.

## Context

v0.3.0 refreshed models and proved per-agent routing works with valid slugs. v0.4 is about
adopting the platform capabilities Cursor shipped in 3.6–3.8 — turning Team Avatar's *prose*
rules into *enforced* behavior and making the harness event-driven.

## Candidate features (researched)

| Feature | What it is | Fit for Team Avatar |
| ------- | ---------- | ------------------- |
| **`.cursor/hooks.json` lifecycle hooks** | Structured hooks over stdio JSON at agent-loop events (`subagentStart`, before/after edit, before shell, etc.); works local + cloud | **High** — enforce the orchestrator's hard constraints instead of hoping the model obeys |
| **Auto-review run mode** | Classifier-gated Shell/MCP/Fetch calls steered via `permissions.json` (`autoRun.allow_instructions` / `block_instructions`); ~84% fewer prompts | **High** — let Team Avatar run longer, safely, with a tuned policy shipped in-repo |
| **Automations + `/automate`** | Always-on agents from GitHub/Slack triggers; `/automate` configures them in plain language | **Medium** — ship Team Avatar automation recipes; plan/cloud dependent |
| **Computer use in automations** | Cloud agents drive their own computer to produce demo/artifact proof (on by default) | **Medium** — native self-verification; could complement the Codex QA loop |
| **Deep subagent nesting** | SDK agents nest to any depth — **but in-editor Task subagents remain capped at depth 2** | **None** — harness already designed to depth 2; keep as-is (correct) |

## Proposed v0.4 scope (prioritized)

### P0 — `.cursor/hooks.json`: enforce the orchestrator
Today `orchestrator.mdc` is prose the model *may* follow. Cursor's hook events make several of
its "HARD CONSTRAINTS" actually enforceable:
- `subagentStart` → enforce the agent allowlist + depth/dispatch caps (deny illegal spawns).
- before-shell hook → block destructive commands (the project already promises this).
- after-edit hook → run lints (replaces/upgrades the current `post-edit-lint.sh`).
- Migrate the two legacy shell hooks (`post-edit-lint.sh`, `pre-commit-check.sh`) into the
  structured `hooks.json` format; keep shell scripts as the hook handlers.
- **Risk:** hook schema/events must be verified on the user's build; start with non-blocking
  (observe) hooks, then promote to blocking once validated.

### P1 — `permissions.json`: ship an Auto-review policy
- Provide a tuned `permissions.json` so Team Avatar agents auto-run safe calls (lints, tests,
  builds, read-only git/grep) and hold/deny risky ones (destructive fs, network writes).
- Document the run-mode setting (Settings → Agents → Approvals & Execution).
- **Note:** auto-review is "best-effort, not a security guarantee" — pair with the P0 blocking
  hooks for anything that must be hard-stopped.

### P2 — Automation recipes + `/automate`
- Ship example Team Avatar automations: e.g. *PR review comment → dispatch Katara to fix*;
  *issue labeled `design` → dispatch Zuko*; *Slack 🔥 emoji → dispatch the relevant agent*.
- Document `/automate` to generate these from plain language.
- **Dependency:** requires the user's plan/cloud-agent access; gate behind validation.

### P3 (exploratory) — Native computer-use QA loop
- Use automations' built-in computer use for self-verification (demos/artifacts), reducing
  reliance on the external Codex loop documented in `VALIDATION.md` §4.
- Decide based on quality vs. the independent-second-tool value of Codex.

## Explicitly out of scope
- Relaxing `max depth = 2` — it's a Cursor platform limit for in-editor subagents, not a design
  choice. Keep the current architecture.

## Validation gates (each ships only after)
1. Confirm the hook event names/schema on the current Cursor build (start observe-only).
2. Confirm `permissions.json` keys + run-mode behavior on Pro.
3. Confirm automation triggers the user's plan exposes.

## Open questions for prioritization
- Is the headline of v0.4 **enforcement** (P0/P1 hooks + auto-review) or **automation** (P2)?
- Cloud-agent/automation features depend on plan tier — in scope now, or defer?
