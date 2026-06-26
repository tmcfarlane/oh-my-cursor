# Team Avatar Automations

Event-driven Team Avatar dispatches — *"PR review comment → Katara fixes it"*, *"🔥 in Slack
→ Zuko mocks it up"* — built on **Cursor Automations** (Cursor 3.8+).

> **Read this first.** Cursor automations are **cloud-only**. There is no committable
> automation file (as of June 2026, Cursor hasn't shipped a `.cursor/automations` format —
> [config-as-code is an open request](https://forum.cursor.com/t/config-as-code-for-automations/154831)).
> So this directory ships **recipes** — ready-to-paste `/automate` prompts — not config you
> can install. You create each automation once via `/automate` or
> [cursor.com/automations](https://cursor.com/automations); Cursor stores it in the cloud.

## Three things to know about Cursor automations

1. **You pick a model, not an agent.** An automation runs one cloud agent defined by a
   free-text prompt + a selected **model** — there's no field to invoke `@katara`/`@zuko`.
   Team Avatar personas are therefore **baked into the recipe prompt** (self-contained), so
   they work even though the cloud run can't `Task`-dispatch a subagent.
2. **Automations run as cloud agents in a fresh clone.** They don't run the local
   orchestrator root thread, and Cursor only auto-applies rules from `.cursor/rules/` —
   which is gitignored. So don't rely on the installed orchestrator rule being active; the
   recipes are self-contained, and where they reference repo files they do so **by explicit
   path** (e.g. "read `rules/orchestrator.mdc`").
3. **Hooks likely don't apply to cloud automation runs.** oh-my-cursor's hook guardrails
   (`guard-shell.sh`, etc.) install under the gitignored `.cursor/`, so a cloud sandbox won't
   have them. *(Strong inference, not a documented guarantee — verify before relying on it.)*
   Treat automation prompts as the safety boundary: scope them tightly and avoid destructive
   instructions.

## How to install a recipe

1. In a local Cursor Agent chat, type **`/automate`** and paste the recipe's prompt — or open
   [cursor.com/automations](https://cursor.com/automations) → **New automation**.
2. Set the **trigger** and **model** as listed in the recipe.
3. Choose the repo / context and save. Cursor stores it in the cloud and fires on the trigger.

## Recipes

| Recipe | Trigger | Acts as | Model |
| ------ | ------- | ------- | ----- |
| [PR review comment → fix](recipes/pr-review-comment-katara.md) | GitHub: PR review comment | Katara (surgical fix) | `composer-2.5-fast` |
| [Issue labeled `design` → mockup](recipes/issue-design-zuko.md) | GitHub: issue label (via webhook) | Zuko (visual) | `gemini-3.1-pro` |
| [Slack emoji → routed dispatch](recipes/slack-emoji-dispatch.md) | Slack: emoji reaction | routed by emoji | per-emoji |

## Trigger catalog (Cursor 3.8)

Scheduled (preset or cron) · GitHub (PR opened/pushed/merged/commented, **PR review comment**,
**PR review submitted**, **review thread updated**, **issue comment**, workflow run completed,
label changed) · GitLab · **Slack emoji reaction** / message / channel · generic **Webhook** ·
Linear · Sentry · PagerDuty. Bold = new in 3.8.

> Recipes are written to port trivially to a future `.cursor/automations/*` format if Cursor
> ships one.
