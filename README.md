<p align="center">
  <a href="https://github.com/tmcfarlane/oh-my-cursor">
    <picture>
      <source srcset="screenshots/prompt.png" media="(prefers-color-scheme: dark)">
      <source srcset="screenshots/prompt.png" media="(prefers-color-scheme: light)">
      <img src="screenshots/prompt.png" alt="Oh My Cursor">
    </picture>
  </a>
</p>
<p align="center">Like "oh-my-zsh" but for Cursor — multi-agent orchestration, natively.</p>

---

## What Is This?

**Oh My Cursor** is a curated set of AI agent configurations for [Cursor IDE](https://cursor.com). One install gives you a team of specialized agents that coordinate autonomously through Cursor's native subagent system.

No CLI wrapper. No external runtime. Just `.cursor/agents/` files and one orchestrator rule that turns Cursor into a multi-agent IDE.

### The Problem

Cursor's subagent system (`Task` tool) is powerful but underutilized. Out of the box, every agent is generic. Oh My Cursor gives each agent a distinct role, personality, and set of operating procedures — so the orchestrator knows *when* to delegate, *who* to delegate to, and *how* to verify the work.

### The Solution

```
You (Root Thread) — orchestrator.mdc always applied
 ├── Task(explore)        → searches codebase, returns structured results
 ├── Task(librarian)      → searches external docs with GitHub permalinks
 ├── Task(prometheus)     → creates detailed work plans
 ├── Task(hephaestus)     → deep autonomous implementation
 ├── Task(atlas)          → systematic task list execution
 ├── Task(oracle)         → architecture advice and hard debugging
 ├── Task(metis)          → pre-planning analysis for ambiguous requests
 ├── Task(momus)          → reviews plans before execution
 ├── Task(sisyphus)       → disciplined multi-step execution
 ├── Task(generalPurpose) → focused single-domain work
 └── Task(multimodal)     → PDF, image, and diagram analysis
```

---

## Quick Start

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh)
```

That's it. The installer places agent manifests into `~/.cursor/agents/` and the orchestrator rule into `~/.cursor/rules/`. They apply globally to all your Cursor projects.

### Options

```bash
# Install to current project only (instead of globally)
bash <(curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh) --project

# Preview what would be installed
bash <(curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh) --dry-run

# Overwrite existing files
bash <(curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh) --force

# Remove all installed files
bash <(curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh) --uninstall
```

### Installation Scope

| Flag | Directory | Applies To |
|------|-----------|------------|
| `--user` (default) | `~/.cursor/agents/` | All Cursor projects |
| `--project` | `./.cursor/agents/` | Current project only |

---

## Agents

The orchestrator auto-detects what kind of work you're asking for and dispatches the right agent. You don't need to invoke them manually — just ask Cursor to do something and the orchestrator handles delegation.

### Orchestrator

The `orchestrator.mdc` rule is applied to every conversation. It classifies your request, fires background agents proactively (e.g., `explore` when multiple files are involved, `librarian` when an external library is mentioned), and chains multi-phase workflows automatically.

| Phase | What Happens |
|-------|-------------|
| **Intent Gate** | Classifies request type, fires auto-triggers |
| **Codebase Assessment** | Evaluates project maturity and conventions |
| **Agent Dispatch** | Delegates to the right agent(s) in parallel |
| **Verification** | Confirms lints, builds, and tests pass |
| **Failure Recovery** | Reverts and escalates after 3 consecutive failures |

### Available Agents

| Agent | Role | When It's Used |
|-------|------|----------------|
| **sisyphus** | Disciplined complex executor | Multi-step tasks needing structured approach and verification |
| **hephaestus** | Autonomous deep worker | Complex multi-file tasks requiring thorough exploration + implementation |
| **prometheus** | Strategic planner | Complex features needing detailed work plans before implementation |
| **atlas** | Systematic task executor | Working through ordered task lists with verification at each step |
| **oracle** | Architecture consultant | Complex design decisions, hard debugging after 2+ failed fixes |
| **metis** | Pre-planning analyst | Ambiguous scope, hidden requirements, intent classification |
| **momus** | Plan reviewer | Validates work plans before execution — catches blocking issues only |
| **explore** | Codebase search specialist | Multiple search angles, unfamiliar modules, pattern discovery |
| **librarian** | External docs researcher | Unfamiliar libraries, official API docs, OSS implementation examples |
| **generalPurpose** | Focused task executor | Clear implementation tasks, single-domain work |
| **multimodal-looker** | Media file analyzer | PDFs, images, diagrams needing interpretation |

---

## How It Works

### Multi-Phase Orchestration

For complex tasks, agents are chained sequentially. The orchestrator passes results between phases — subagents have no shared context.

```
Phase 1: Pre-planning (optional, for ambiguous requests)
  → metis analyzes intent, surfaces hidden requirements

Phase 2: Planning
  → prometheus creates detailed work plan with acceptance criteria

Phase 3: Plan Review (optional)
  → momus validates the plan, catches blocking issues

Phase 4: Execution
  → hephaestus / atlas / sisyphus implements the plan end-to-end

Phase 5: Verification
  → oracle reviews implementation quality
```

### Auto-Triggers

The orchestrator scans every request for signals and fires agents proactively:

| Signal | Action |
|--------|--------|
| 2+ modules/files involved | Fires `explore` in background |
| External library mentioned | Fires `librarian` in background |
| "How does X work?" | Fires `explore` (1-3 parallel) |
| Ambiguous or complex scope | Fires `metis` for pre-planning |
| Complex architecture decision | Consults `oracle` before acting |
| 2+ failed fix attempts | Consults `oracle` with full failure context |

### Verification Protocol

After every delegation that modifies code:

1. `ReadLints` on changed files — zero errors
2. Build command — exit code 0
3. Test suite — all pass
4. Read changed files — confirm requirements met

**No evidence = not complete.**

---

## Screenshots

![Orchestration phases](screenshots/phase_breakdown.png)

![Phase 1: Codebase Assessment](screenshots/phase1.png)

![Phase 2: Agent Dispatch](screenshots/phase2.png)

---

## Project Structure

```
oh-my-cursor/
├── agents/
│   ├── atlas.md              # Systematic task executor
│   ├── explore.md            # Codebase search specialist
│   ├── generalPurpose.md     # Focused task executor
│   ├── hephaestus.md         # Autonomous deep worker
│   ├── librarian.md          # External docs researcher
│   ├── metis.md              # Pre-planning consultant
│   ├── momus.md              # Plan reviewer
│   ├── multimodal-looker.md  # Media file analyzer
│   ├── oracle.md             # Architecture consultant
│   ├── orchestrator.mdc      # Root orchestration rule
│   ├── prometheus.md         # Strategic planner
│   └── sisyphus.md           # Disciplined complex executor
├── install.sh                # Self-contained installer
├── vercel.json               # Serves install.sh at opencode.ai/install
└── README.md
```

---

## FAQ

#### Do I need to manually choose agents?

No. The orchestrator classifies your request and dispatches the right agent automatically. Just talk to Cursor normally.

#### Does this work with Cursor's free tier?

It works with any Cursor plan that supports agent mode. The agents are just markdown files — they configure how Cursor's existing subagent system behaves.

#### Can I add my own agents?

Yes. Drop a `.md` file into `~/.cursor/agents/` (or `.cursor/agents/` in your project). The orchestrator will recognize it if you reference it in your conversations or update the orchestrator rule to include it.

#### How do I update?

Run the installer again with `--force`:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh) --force
```

#### How do I uninstall?

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh) --uninstall
```

---

## Inspiration

- **[oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)** — The original OpenCode plugin that heavily inspired this project. Oh My Cursor adapts the multi-agent philosophy for Cursor's native subagent system.

---

## License

SUL-1.0
