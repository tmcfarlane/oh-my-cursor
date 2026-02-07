# Cursor Subagents Package

Enhanced Cursor subagent configurations ported from Oh-My-OpenCode's comprehensive agent system.

## Quick Install

```bash
curl -fsSL https://opencode.ai/install | bash
```

### Install options

| Flag | Short | Description |
|------|-------|-------------|
| `--force` | `-f` | Overwrite existing agent files |
| `--dry-run` | `-n` | Preview changes without writing anything |
| `--verbose` | `-v` | Show detailed output |
| `--user` | | Install to `~/.cursor/agents/` (default) |
| `--project` | | Install to `./.cursor/agents/` (project-local) |
| `--uninstall` | | Remove installed agents and orchestrator rule |
| `--version` | | Print installer version |
| `--help` | `-h` | Show help message |

```bash
# Preview what will be installed
curl -fsSL https://opencode.ai/install | bash -s -- --dry-run

# Overwrite existing agents with latest versions
curl -fsSL https://opencode.ai/install | bash -s -- --force

# Install into the current project only
curl -fsSL https://opencode.ai/install | bash -s -- --project
```

## What Gets Installed

11 specialized agents are installed to `~/.cursor/agents/` by default (user-global), plus the **orchestrator rule** to `~/.cursor/rules/`.

To install into a specific project instead, use `--project` (targets `./.cursor/agents/` and `./.cursor/rules/`).

| Component | Target | Purpose |
|-----------|--------|---------|
| Agent `.md` files | `agents/` | Subagent definitions |
| `orchestrator.mdc` | `rules/` | Always-applied rule that coordinates agent dispatch |

### Model selection

Installed agents are normalized to include `model: inherit` in their frontmatter so they reliably run using your currently selected chat model (matching Cursor's built-in agent files).

### Avoid dual installs (important)

Don't install the same agent set into **both** `./.cursor/agents/` and `~/.cursor/agents/` at the same time. If both exist, Cursor can sometimes resolve duplicates inconsistently.

## Architecture

The root conversation thread is the **orchestrator**. It has the `Task` tool and decides which agents to fire. All agents run as **leaf nodes** — they do their specialized work and return results. Agents cannot spawn other agents.

```
Root Thread (orchestrator.mdc always applied)
 │
 ├── /hephaestus  → deep autonomous execution
 ├── /sisyphus    → disciplined complex execution
 ├── /atlas       → systematic task list execution
 ├── /prometheus  → strategic planning
 ├── /explore     → codebase search
 ├── /librarian   → external docs research
 ├── /oracle      → architecture consultation
 └── ... etc      → all are leaf nodes
```

The `orchestrator.mdc` rule (auto-installed to `.cursor/rules/` with `alwaysApply: true`) gives the root thread intelligence about **when** and **how** to fire each agent. It contains signal detection, request classification, parallel execution patterns, and delegation prompt structure.

### Agents

| Agent | Role |
|-------|------|
| **hephaestus** | Autonomous deep worker — explores thoroughly, completes end-to-end, never stops early |
| **sisyphus** | Disciplined complex executor — codebase assessment, structured approach, obsessive verification |
| **atlas** | Systematic task list executor — works through ordered checklists with verification |
| **prometheus** | Strategic planner — interview mode, creates detailed work plans with acceptance criteria |
| **metis** | Pre-planning consultant — intent classification, ambiguity detection, AI-slop prevention |
| **momus** | Plan reviewer — validates work plans, catches blocking issues only |
| **explore** | Codebase search — parallel tools, structured `<results>` format |
| **librarian** | External docs researcher — Doc Discovery workflow, GitHub permalinks |
| **oracle** | Read-only strategic advisor — architecture decisions, hard debugging |
| **generalPurpose** | Focused task executor — clear scope, direct execution |
| **multimodal-looker** | Media analyzer — PDFs, images, diagrams |

## Usage in Cursor

After installation:

1. Open Cursor Settings > **Rules, Skills, Subagents**
2. Ensure **"Include third-party skills, subagents, and other configs"** is enabled
3. Scroll to **Subagents** and confirm your agents are listed (e.g. `atlas`, `sisyphus`)

### Full orchestration prompt

To activate multi-agent orchestration, copy and paste this prompt template into Cursor Agent mode. Replace `<YOUR TASK HERE>` with your actual request.

```
<YOUR TASK HERE>

Use /prometheus /multimodal-looker /oracle /momus /hephaestus /metis /librarian /generalPurpose /explore /sisyphus /atlas to complete this implementation. Orchestrate among them where you see it makes the most sense.
```

> **Why is this needed?** Cursor doesn't automatically engage all subagents. Tagging them explicitly with `/agent-name` makes them available. The `orchestrator.mdc` rule is auto-applied (installed to `.cursor/rules/`) so the root thread already knows *how* to coordinate them -- no need to reference it manually.

#### Example: single prompt

Give it the task and the orchestration block in one shot.

```
Build a REST API with authentication and rate limiting in the /api folder

Use /prometheus /multimodal-looker /oracle /momus /hephaestus /metis /librarian /generalPurpose /explore /sisyphus /atlas to complete this implementation. Orchestrate among them where you see it makes the most sense.
```

The orchestrator rule kicks in automatically and fires `explore` to scan the codebase, `librarian` for best practices, `prometheus` to plan, and `hephaestus` to implement.

#### Example: plan first, then execute

For complex work, split it into two prompts. First, create a plan:

```
/prometheus Create a detailed work plan for adding user authentication with JWT, refresh tokens, and role-based access control
```

Then kick off full orchestration to implement the plan:

```
Build this plan.

Use /prometheus /multimodal-looker /oracle /momus /hephaestus /metis /librarian /generalPurpose /explore /sisyphus /atlas to complete this implementation. Orchestrate among them where you see it makes the most sense.
```

The orchestrator breaks the plan into phases -- research, parallel implementation, wiring, verification -- and dispatches agents to each phase.

#### What it looks like

The orchestration prompt kicks off a phased execution plan:

![Orchestration prompt in Cursor](screenshots/prompt.png)

The orchestrator breaks work into phases and assigns agents:

![Phase breakdown with agent assignments](screenshots/phase_breakdown.png)

Phases execute with agents reporting back to the root thread:

![Phase 1: Research and pre-analysis](screenshots/phase1.png)

![Phase 2: Parallel implementation](screenshots/phase2.png)

### How to prompt (other patterns)

**Direct agent invocation** — use `/agent-name` to invoke a single agent for focused work.

```
/explore Find all API endpoints in this codebase
/librarian How do I use React Query for caching?
/oracle Review my authentication implementation
/prometheus Create a work plan for adding dark mode
/hephaestus Implement the search feature end-to-end
```

**Selective multi-agent** — tag just the agents you want involved.

```
/prometheus /metis Plan the authentication feature
/hephaestus /explore Refactor the database layer
```

### Choosing the right agent

| Task | Agent |
|------|-------|
| Complex multi-file implementation | `/hephaestus` |
| Multi-step task needing structure | `/sisyphus` |
| Working through a task list | `/atlas` |
| Planning before implementation | `/prometheus` |
| Quick codebase search | `/explore` |
| External docs / library question | `/librarian` |
| Architecture review / hard debugging | `/oracle` |
| Clear, scoped implementation | `/generalPurpose` |
| Analyzing a PDF or image | `/multimodal-looker` |

## Philosophy

These agents embody the Ultrawork Manifesto principles:

- **Human intervention is a failure signal** - agents complete work autonomously
- **Code indistinguishable from senior engineer** - no AI slop
- **Token cost acceptable for productivity** - parallel exploration is worth it
- **Minimize human cognitive load** - express intent, agent handles execution
- **Predictable, continuous, delegatable** - work survives interruptions

## Customization

To customize an agent after installation:

1. Edit the file directly at `./.cursor/agents/<agent-name>.md` (project) or `~/.cursor/agents/<agent-name>.md` (user)
2. Re-run the installer with `--force` to reset to defaults

## Updating

When agent definitions are updated upstream:

```bash
curl -fsSL https://opencode.ai/install | bash -s -- --force
```

## Uninstalling

```bash
# Remove agents from ~/.cursor/agents/ (default)
curl -fsSL https://opencode.ai/install | bash -s -- --uninstall

# Remove agents from ./.cursor/agents/
curl -fsSL https://opencode.ai/install | bash -s -- --uninstall --project

# Preview what will be removed
curl -fsSL https://opencode.ai/install | bash -s -- --uninstall --dry-run
```

Only agents managed by this package are removed. Custom agents you've added are left untouched.
