# Recipe: Slack emoji reaction → routed Team Avatar dispatch

React to a Slack message with an emoji to kick off the matching Team Avatar agent on the
linked repo/task.

| Field | Value |
| ----- | ----- |
| **Trigger** | Slack → **emoji reaction** (new in Cursor 3.8) |
| **Model** | per emoji (see table) |
| **Repo context** | your default repo, or the one named in the reacted message |

## Emoji → avatar map

| Emoji | Avatar | Intent | Model |
| ----- | ------ | ------ | ----- |
| 🔧 `:wrench:` | Katara | surgical fix of the described bug | `composer-2.5-fast` |
| 🎨 `:art:` | Zuko | visual mockup / icon | `gemini-3.1-pro` |
| 🔍 `:mag:` | Toph | scout/search & report findings | `composer-2.5-fast` |
| 🧠 `:brain:` | Sokka | plan a multi-step approach (no code) | `claude-opus-4-8-thinking-high` |

You can create **one automation per emoji** (most explicit), or a **single `:robot:`
router** automation that reads the message and self-routes. Slack/emoji triggers select a
**model only**, so the persona + routing live in the prompt.

## Option A — one automation per emoji (example: 🔧 → Katara)

Trigger: Slack emoji reaction = `:wrench:`. Model: `composer-2.5-fast`. Prompt:

```text
You are KATARA of Team Avatar. The reacted Slack message describes a bug or small change.
Make the SMALLEST possible fix in the linked/default repo, run the project's checks, open a
PR, and reply in the Slack thread with the PR link. Never force-push, never touch unrelated
files, never run destructive commands. If under-specified, reply in-thread asking for the
repo/branch and stop.
```

## Option B — single `:robot:` router

Trigger: Slack emoji reaction = `:robot:`. Model: `composer-2.5-fast`. Prompt:

```text
You are the Team Avatar dispatcher. Read the reacted Slack message and route to ONE persona,
then act as that persona for a single focused task:
- bug / "fix" / error      -> KATARA: smallest possible fix, open a PR.
- icon / mockup / "design"  -> ZUKO: generate one visual proposal, post it.
- "how does X work" / find  -> TOPH: search the repo and report findings in-thread.
- "plan" / multi-step       -> SOKKA: produce a short plan, no code.
Reply in the Slack thread with the result or PR link. Stay within the one task. Never run
destructive commands or force-push. If the target repo is unclear, ask in-thread and stop.
```

> For deeper reasoning on the `:brain:`/Sokka path, set that automation's model to
> `claude-opus-4-8-thinking-high`.

## Notes
- Requires the Cursor ↔ Slack integration connected to the workspace.
- One emoji = one model; cross-persona routing (Option B) is done in the prompt, since the
  trigger can't pick a model per message.
