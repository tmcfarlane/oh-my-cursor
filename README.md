<div align="center">

<div style="font-size: 2.0em; font-weight: 800; line-height: 1.1;">
  <strong>oh-my-cursor</strong>
</div>

<div style="font-size: 0.85em; font-weight: 400; letter-spacing: 0.25em; text-transform: uppercase; margin: 4px 0;">presents</div>

<p align="center">
  <a href="https://github.com/tmcfarlane/oh-my-cursor">
    <img src="screenshots/teamavatar.png" alt="oh-my-cursor: Team Avatar Agent Orchestration" width="560">
  </a>
</p>
<div style="font-size: 2.5em; font-weight: 700; letter-spacing: 0.12em;">
  <strong>TEAM AVATAR</strong>
</div>

Multi-agent philosophy for Cursor subagents. Nothing but config files.<br>
_Created by <a href="https://zeroclickdev.ai/">ZeroClickDev</a>_

**NOW USING UNDOCUMENTED FEATURES OF CURSOR!**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/tmcfarlane/oh-my-cursor)](https://github.com/tmcfarlane/oh-my-cursor/stargazers)
<br>

</div>

> **April 14, 2026 — Welcome [@bastien70](https://github.com/bastien70) to Team Avatar!** Two fantastic PRs just landed:
>
> - **Composer 2 Fast migration** — All default agents now run on Composer 2 Fast, aligning with Cursor's Auto + Composer pool for lower latency and cost ([#20](https://github.com/tmcfarlane/oh-my-cursor/issues/20))
> - **Zuko gets Nana Banana** — Zuko now has image generation capabilities powered by Nana Banana, leveling up the Firebender's visual toolkit
>
> These contributions were so solid that [@bastien70](https://github.com/bastien70) has been added as a **CODEOWNER** — they can now approve PRs from other contributors. Welcome to the project! 🎉
>
> Want to contribute too? [Contributions welcome!](CONTRIBUTING.md)

## Quick Start (One Command)

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.ps1 | iex
```

## What Is This?

**8 agent manifests, 8 slash commands, hooks, and one orchestration rule** — themed around Avatar: The Last Airbender. No external runtime, no wrapper CLI — just Cursor's built-in `Task` subagents and Markdown config files.

> Uses [undocumented custom model aliases](#undocumented-custom-model-aliases) for per-agent model routing. Unofficial — may change.

## Contents

- [Quick Start](#quick-start-one-command)
- [What Is This?](#what-is-this)
- [Agents](#team-avatar----the-agents)
- [How to Install](#how-to-install)
- [Slash Commands](#slash-commands)
- [Orchestration Modes](#two-orchestration-modes)
- [Architecture](#architecture)
- [Skills](#skills)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## The Orchestrator

The orchestrator rule (`orchestrator.mdc`) rewires how the root thread thinks. The root becomes a **pure dispatcher** — its only permitted tools are `Task`, `TodoWrite`, `AskQuestion`, and `SwitchMode`. All work flows through specialist agents.

Here's a real example of the root thread's internal reasoning:

> **Planning Installation Instructions**
>
> I need to follow the orchestrator's guidance, since the root can't use Read directly and must delegate via Task. I have to document this in the README and use iroh, but I'm unsure about the new installation instructions, which might be documented elsewhere. It's critical to know these details, so I could search the repository with iroh/toph for existing install docs. I'll have to organize a plan: dispatch toph to find the installation instructions and have iroh update the README after. Plus, I'll create a to-do list to keep track of everything.

Every sentence maps to an orchestrator rule: agent routing (Iroh for docs, Toph for search), phase chaining (explore → write), and mandatory task tracking via `TodoWrite`.

## Team Avatar -- The Agents

Eight specialized agents, each mapped to an Avatar character with a dedicated model and role. Expand any agent for skills and working screenshots.

<p align="center">
  <a href="#agent-aang"><img src="screenshots/faces/aang.png" width="96" height="96" alt="Aang" /></a>&nbsp;&nbsp;
  <a href="#agent-sokka"><img src="screenshots/faces/sokka.png" width="96" height="96" alt="Sokka" /></a>&nbsp;&nbsp;
  <a href="#agent-katara"><img src="screenshots/faces/katara.png" width="96" height="96" alt="Katara" /></a>&nbsp;&nbsp;
  <a href="#agent-zuko"><img src="screenshots/faces/zuko.png" width="96" height="96" alt="Zuko" /></a>&nbsp;&nbsp;
  <a href="#agent-toph"><img src="screenshots/faces/toph.png" width="96" height="96" alt="Toph" /></a>&nbsp;&nbsp;
  <a href="#agent-appa"><img src="screenshots/faces/appa.png" width="96" height="96" alt="Appa" /></a>&nbsp;&nbsp;
  <a href="#agent-momo"><img src="screenshots/faces/momo.png" width="96" height="96" alt="Momo" /></a>&nbsp;&nbsp;
  <a href="#agent-iroh"><img src="screenshots/faces/iroh.png" width="96" height="96" alt="Iroh" /></a>
</p>

<a id="agent-aang"></a>

<details open>
<summary><img src="screenshots/faces/aang.png" width="20" height="20" /> <strong>Aang</strong> — <em>The Avatar</em> · <code>composer-2-fast</code></summary>

Deep multi-file executor + architecture consultant. Masters all elements.

> **Master of all four elements** — Multi-agent orchestration in action

Skills: [`design-patterns-implementation`](skills/design-patterns-implementation/SKILL.md) · [`refactoring-patterns`](skills/refactoring-patterns/SKILL.md) · [`vercel-react-best-practices`](skills/vercel-react-best-practices/SKILL.md)

<p align="center"><a href="screenshots/teamavatar/aang.png"><img src="screenshots/teamavatar/aang.png" alt="Aang working screenshot"></a></p>

</details>

<a id="agent-sokka"></a>

<details open>
<summary><img src="screenshots/faces/sokka.png" width="20" height="20" /> <strong>Sokka</strong> — <em>The Strategist</em> · <code>claude-4.6-opus-max-thinking</code></summary>

Planning, ambiguity analysis, plan review. The brain behind every mission.

> **Ask First, Dispatch Second** — The orchestrator clarifies before sending agents

Skills: [`architect`](skills/architect/SKILL.md) · [`planning`](skills/planning/SKILL.md) · [`technical-roadmap-planning`](skills/technical-roadmap-planning/SKILL.md)

<p align="center"><a href="screenshots/teamavatar/sokka.png"><img src="screenshots/teamavatar/sokka.png" alt="Sokka working screenshot"></a></p>

</details>

<a id="agent-katara"></a>

<details open>
<summary><img src="screenshots/faces/katara.png" width="20" height="20" /> <strong>Katara</strong> — <em>The Healer</em> · <code>composer-2-fast</code></summary>

Disciplined implementation, debugging, methodical fixes. Mends broken code.

> **Precision Healer** — Surgical debugging, smallest possible fix

Skills: [`debugging`](skills/debugging/SKILL.md) · [`refactoring`](skills/refactoring/SKILL.md) · [`refactoring-patterns`](skills/refactoring-patterns/SKILL.md)

<p align="center"><a href="screenshots/teamavatar/katara.png"><img src="screenshots/teamavatar/katara.png" alt="Katara working screenshot"></a></p>

</details>

<a id="agent-zuko"></a>

<details open>
<summary><img src="screenshots/faces/zuko.png" width="20" height="20" /> <strong>Zuko</strong> — <em>The Firebender</em> · <code>gemini-3.1-pro</code></summary>

Visual design: image generation, icons, UI mockups. Brings designs to life.

> **Fire and Finesse** — Image generation, icons, and UI mockups

Skills: [`create-an-asset`](skills/create-an-asset/SKILL.md) · [`implementing-figma-designs`](skills/implementing-figma-designs/SKILL.md) · [`web-design-guidelines`](skills/web-design-guidelines/SKILL.md)

<p align="center"><a href="screenshots/teamavatar/zuko.png"><img src="screenshots/teamavatar/zuko.png" alt="Zuko working screenshot"></a></p>

</details>

<a id="agent-toph"></a>

<details>
<summary><img src="screenshots/faces/toph.png" width="20" height="20" /> <strong>Toph</strong> — <em>The Seer</em> · <code>composer-2-fast</code></summary>

Codebase search, external docs, media analysis. Sees everything.

> **Seismic Sense** — Multi-angle codebase search and doc exploration

Skills: [`codebase-search`](skills/codebase-search/SKILL.md) · [`exploring-codebases`](skills/exploring-codebases/SKILL.md) · [`mgrep-code-search`](skills/mgrep-code-search/SKILL.md)

<p align="center"><a href="screenshots/teamavatar/toph.png"><img src="screenshots/teamavatar/toph.png" alt="Toph working screenshot"></a></p>

</details>

<a id="agent-appa"></a>

<details>
<summary><img src="screenshots/faces/appa.png" width="20" height="20" /> <strong>Appa</strong> — <em>The Heavy Lifter</em> · <code>composer-2-fast</code></summary>

Systematic task list execution. Carries the team.

> **Plan Executor** — Systematic task list execution, one step at a time

Skills: [`frontend-builder`](skills/frontend-builder/SKILL.md) · [`vercel-composition-patterns`](skills/vercel-composition-patterns/SKILL.md) · [`vercel-react-best-practices`](skills/vercel-react-best-practices/SKILL.md)

<p align="center"><a href="screenshots/teamavatar/appa.png"><img src="screenshots/teamavatar/appa.png" alt="Appa working screenshot"></a></p>

</details>

<a id="agent-momo"></a>

<details>
<summary><img src="screenshots/faces/momo.png" width="20" height="20" /> <strong>Momo</strong> — <em>The Scout</em> · <code>composer-2-fast</code></summary>

Quick focused tasks. Small, agile, independent.

> **Speed Demon** — Parallel micro-tasks, maximum speed

Skills: [`refactoring`](skills/refactoring/SKILL.md) · [`refactoring-patterns`](skills/refactoring-patterns/SKILL.md) · [`vercel-react-best-practices`](skills/vercel-react-best-practices/SKILL.md)

<p align="center"><a href="screenshots/teamavatar/momo.png"><img src="screenshots/teamavatar/momo.png" alt="Momo working screenshot"></a></p>

</details>

<a id="agent-iroh"></a>

<details>
<summary><img src="screenshots/faces/iroh.png" width="20" height="20" /> <strong>Iroh</strong> — <em>The Storyteller</em> · <code>claude-4.6-opus-max-thinking</code></summary>

Documentation specialist. Sole owner of README, CHANGELOG, and all project docs.

> **Man of his letters** — Iroh spends much of his time writing letters to family.

Skills: [`crafting-effective-readmes`](skills/crafting-effective-readmes/SKILL.md) · [`docs-write`](skills/docs-write/SKILL.md) · [`documentation-engineer`](skills/documentation-engineer/SKILL.md) · [`documentation-writing`](skills/documentation-writing/SKILL.md)

<p align="center"><a href="screenshots/teamavatar/iroh.png"><img src="screenshots/teamavatar/iroh.png" alt="Iroh working screenshot"></a></p>

</details>

## Model Policy

Default model: **[Composer 2 Fast](https://cursor.com/docs/models/cursor-composer-2.md)** (`composer-2-fast`). Higher speed, uses Cursor’s Auto + Composer pool. ([#20](https://github.com/tmcfarlane/oh-my-cursor/issues/20), [#21](https://github.com/tmcfarlane/oh-my-cursor/issues/21))

**Exceptions:**

| Agent     | Model                          | Reason                                 |
| --------- | ------------------------------ | -------------------------------------- |
| **Sokka** | `claude-4.6-opus-max-thinking` | Maximum reasoning for complex planning |
| **Iroh**  | `claude-4.6-opus-max-thinking` | Long-form documentation quality        |
| **Zuko**  | `gemini-3.1-pro`               | Multimodal / visual stack              |

Coordinator-spawned workers may use Cursor’s `fast` tier or inherit the coordinator’s model. If a workflow regresses on Composer 2 Fast, change `model:` in the agent’s markdown file.

## How to Install

**Requirements:** [Cursor](https://www.cursor.com/) with agent mode (subagents). No external runtime.

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.sh | bash
```

<details>
<summary>More options</summary>

```bash
bash -s -- --project     # Install to this project only (./.cursor/)
bash -s -- --claude --codex  # Also install for Claude Code and Codex
bash -s -- --no-skills   # Skip skills installation
bash -s -- --dry-run     # Preview changes
bash -s -- --force       # Update/overwrite existing files
bash -s -- --uninstall   # Uninstall
bash -s -- --disable     # Disable orchestration (agents stay)
bash -s -- --enable      # Re-enable orchestration
```

Append these flags to the `curl ... | bash` one-liner above. Hacking locally? Clone the repo, then run `bash install.sh`.

</details>

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.ps1 | iex
```

<details>
<summary>More options</summary>

```powershell
# PowerShell 7+ / Windows 11 one-liner with flags:
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/tmcfarlane/oh-my-cursor/main/install.ps1))) -Scope project -Force

# Or clone and run locally (all versions):
git clone https://github.com/tmcfarlane/oh-my-cursor.git && cd oh-my-cursor
.\install.ps1                    # Default (user scope)
.\install.ps1 -Scope project    # Project scope
.\install.ps1 -AlsoClaude -AlsoCodex  # Cross-tool compat
.\install.ps1 -NoSkills         # Skip skills
.\install.ps1 -Force            # Overwrite
.\install.ps1 -Uninstall        # Remove
```

> On Windows PowerShell 5.1, `irm | iex` only supports default install. For flags, clone the repo.

</details>

### What Gets Installed

| Scope              | Agents                 | Rules                 | Commands                 | Hooks                 | Skills              |
| ------------------ | ---------------------- | --------------------- | ------------------------ | --------------------- | ------------------- |
| `--user` (default) | `~/.cursor/agents/`    | `~/.cursor/rules/`    | `~/.cursor/commands/`    | `~/.cursor/hooks/`    | `~/.cursor/skills/` |
| `--project`        | `./.cursor/agents/`    | `./.cursor/rules/`    | `./.cursor/commands/`    | `./.cursor/hooks/`    | `./.cursor/skills/` |
| `--claude`         | Also `.claude/agents/` | Also `.claude/rules/` | Also `.claude/commands/` | Also `.claude/hooks/` | —                   |
| `--codex`          | Also `.codex/agents/`  | Also `.codex/rules/`  | Also `.codex/commands/`  | Also `.codex/hooks/`  | —                   |
| `--no-skills`      | ✓                      | ✓                     | ✓                        | ✓                     | Skipped             |

> **First-time rule activation:** Cursor may require you to approve the orchestrator rule. Open `~/.cursor/rules/orchestrator.mdc` and click **"Always Allow"** when prompted (one-time step).

> **Upgrading from v0.1:** The installer auto-removes old agent files (hephaestus, prometheus, atlas, etc.).

### Undocumented: Custom Model Aliases

<p align="center">
  <img src="screenshots/guy-spills-it.png" alt="Cursor accepting custom model aliases in agent frontmatter">
</p>

Cursor’s `model:` field in agent frontmatter accepts **arbitrary model alias strings** — not just built-in options. This enables per-agent model routing:

```yaml
---
model: composer-2-fast # fast agent work
---
```

```yaml
---
model: gemini-3.1-pro # multimodal tasks
---
```

> **Undocumented — may change without notice.** Works as of February 2026. If removed, swap `model:` to any picker-supported string; the rest of oh-my-cursor still works.

## Slash Commands

Type these in Cursor's chat to invoke specific workflows:

| Command         | Agent  | Purpose                                                                                                  |
| --------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `/plan`         | Sokka  | Full planning pipeline: ambiguity analysis, plan creation, self-review                                   |
| `/build`        | Aang   | Deep multi-file implementation with verification                                                         |
| `/search`       | Toph   | Multi-angle codebase + docs exploration                                                                  |
| `/fix`          | Katara | Methodical debugging and code healing                                                                    |
| `/tasks`        | Appa   | Systematic task list execution                                                                           |
| `/scout`        | Momo   | Quick focused tasks                                                                                      |
| `/doc`          | Iroh   | Documentation generation and updates                                                                     |
| `/image`        | Zuko   | Cursor image generation (Nano Banana Pro): icons, mockups, prompts via **cursor-image-generation** skill |
| `/cactus-juice` | Swarm  | Decompose into micro-tasks, spawn up to 10 parallel workers                                              |

### Image generation (Cursor agent)

The agent can generate images via **Google Nano Banana Pro**; previews save under **`assets/`** by default. Team Avatar routes visual generation to **Zuko**, which uses the **`cursor-image-generation`** skill ([`skills/cursor-image-generation/SKILL.md`](skills/cursor-image-generation/SKILL.md)) to **rewrite** short user requests into full prompts, then iterate. Use **`/image`** or delegate **`Task(zuko)`** for image-only work.

## Two Orchestration Modes

### Avatar State (Default)

Coordinated, tiered orchestration. The orchestrator auto-detects which agents to dispatch based on request signals.

### Cactus Juice Mode

<p align="left">
  <img src="screenshots/cactus-juice/cactus-juice.jpg" alt="" width="360">
</p>

Activated via `/cactus-juice`. Trades depth for massive parallelism:

1. Root decomposes your request into 5–10 **independent micro-tasks** (single-file scope)
2. Up to **10 subagents spawn simultaneously** using `model: fast`
3. Workers write **low cognitive complexity** code
4. Root collects results, verifies consistency, fixes integration issues

<p align="left">
  <img src="screenshots/cactus-juice/cactus-juice.gif" alt="Cactus Juice mode demo" width="500">
</p>

## Architecture

```mermaid
flowchart TD
  U["You (root thread)"] --> R["orchestrator.mdc<br/>(Team Avatar)"]

  R --> IG{"Intent gate<br/>what did the user ask?"}

  IG -->|"search / 'how does X work?'"| T["Task(toph)<br/>Seer"]
  IG -->|"ambiguous / complex scope"| S["Task(sokka)<br/>Strategist"]
  IG -->|"visual assets"| Z["Task(zuko)<br/>Firebender"]

  IG -->|"complex feature"| PLAN["Task(sokka) → plan"]
  PLAN --> IMPL["Task(aang / katara)<br/>Coordinators"]

  IMPL -->|"spawns"| T2["toph (fast)"]
  IMPL -->|"spawns"| M2["momo (fast / inherited)"]

  IG -->|"task list"| AP["Task(appa)<br/>Heavy Lifter"]
  AP -->|"spawns"| M3["momo"]

  IG -->|"quick task"| MO["Task(momo)<br/>Scout"]

  IMPL --> V{"Verification<br/>lints / build / tests"}
  V -->|pass| DONE["Done"]
  V -->|fail| FR["Failure recovery<br/>(retry → aang → user)"]

  subgraph swarmNote ["Swarm Mode (Cursor 2.5+)"]
    N1["Coordinators spawn workers async.<br/>Max depth = 2. Workers are leaf nodes."]
  end
```

## Async Subagents (Cursor 2.5+)

Two-tier swarm: **Coordinators** (Aang, Sokka, Katara, Appa) spawn **Workers** (Toph, Momo) as leaf nodes. Zuko is root-only.

| Pattern               | How It Works                                                      |
| --------------------- | ----------------------------------------------------------------- |
| **Fire-and-Continue** | Spawn Toph in background, continue working, collect results later |
| **Fire-and-Collect**  | Spawn multiple Momo workers, wait for all, verify each            |
| **Research-then-Act** | Parallel Toph research, then use findings to guide implementation |

## Hooks

System-level enforcement that doesn't rely on agents remembering to verify:

| Hook                  | Purpose                                                                         |
| --------------------- | ------------------------------------------------------------------------------- |
| `post-edit-lint.sh`   | Automatically run lints after agent edits                                       |
| `pre-commit-check.sh` | Enforce hard constraints (`as any`, empty catches, `@ts-ignore`) before commits |

## Prompting Tips

```text
You are Team Avatar. Use @toph to explore the codebase, @sokka to create a plan,
and @aang to implement. Verify with lints/build/tests. Keep going until done.
```

Or use slash commands: `/plan add OAuth support with JWT tokens` then `/build based on the plan above`.

## Skills

19 bundled skills vendored from the community. Each is a `SKILL.md` directory that Cursor auto-discovers and presents to agents as domain knowledge. Bundled in-repo for security (no fetching third-party files at install time) and efficiency (single file copy). Installed by default; use `--no-skills` to skip.

### Bundled skills

| Skill                          | Source                            | Agents             | What it provides                                                             |
| ------------------------------ | --------------------------------- | ------------------ | ---------------------------------------------------------------------------- |
| architect                      | thebushidocollective/han          | Sokka              | System architecture and high-level technical design                          |
| codebase-search                | supercent-io/skills-template      | Toph               | Systematic search strategies for navigating large codebases                  |
| create-an-asset                | anthropics/knowledge-work-plugins | Zuko               | Generate tailored sales assets (landing pages, decks, one-pagers)            |
| crafting-effective-readmes     | community                         | Iroh               | Templates and guidance for writing effective READMEs matched to project type |
| debugging                      | oimiragieo/agent-studio           | Katara             | Systematic 4-phase debugging with root cause investigation                   |
| design-patterns-implementation | aj-geddes/useful-ai-prompts       | Aang               | Apply design patterns (Singleton, Factory, Observer, Strategy, etc.)         |
| docs-write                     | metabase/metabase                 | Iroh               | Documentation following Metabase's conversational, user-focused style        |
| documentation-engineer         | charon-fan/agent-playbook         | Iroh               | Technical documentation for creating clear, comprehensive docs               |
| documentation-writing          | rysweet/amplihack                 | Iroh               | Clear, discoverable docs following the Eight Rules and Diataxis framework    |
| exploring-codebases            | community                         | Toph               | Semantic search using AST-aware expansion for full context                   |
| frontend-builder               | daffy0208/ai-dev-standards        | Appa               | Modern React/Next.js frontend patterns and component architecture            |
| implementing-figma-designs     | onekeyhq/app-monorepo             | Zuko               | Implement Figma designs 1:1 using component libraries                        |
| mgrep-code-search              | intellectronica/agent-skills      | Toph               | Semantic code search using mgrep for efficient exploration                   |
| planning                       | thebushidocollective/han          | Sokka              | Technical implementation planning and architecture design                    |
| refactoring                    | eyadsibai/ltk                     | Katara, Momo       | Code restructuring, renaming, extraction, and migration                      |
| refactoring-patterns           | wondelai/skills                   | Aang, Katara, Momo | Named refactoring transformations to improve code structure                  |
| technical-roadmap-planning     | aj-geddes/useful-ai-prompts       | Sokka              | Comprehensive technical roadmaps aligned with business goals                 |
| vercel-composition-patterns    | vercel-labs/agent-skills          | Appa               | React composition patterns that scale                                        |
| vercel-react-best-practices    | vercel-labs/agent-skills          | Aang, Appa, Momo   | React and Next.js performance optimization from Vercel Engineering           |
| web-design-guidelines          | vercel-labs/agent-skills          | Zuko               | Web Interface Guidelines compliance for UI review                            |

**Custom skills:** Create a `SKILL.md` directory under `.cursor/skills/` (project) or `~/.cursor/skills/` (user). Cursor auto-discovers it.

## FAQ

### Do I need to manually choose agents?

No — the orchestrator auto-delegates. Slash commands (`/plan`, `/build`, `/fix`, etc.) give explicit control when you want it.

### Will this work on any Cursor plan?

Yes, if your plan supports agent mode / subagents.

### How do I update?

Re-run the install command with `--force` (or `-Force` on Windows).

### How do I uninstall?

Re-run with `--uninstall` (or `-Uninstall` on Windows).

### Claude Code / Codex?

Yes — install with `--claude --codex` (or `-AlsoClaude -AlsoCodex`).

## Origin Story

Upgraded to Cursor Ultra with 9 days left to burn ~$300 in tokens. Built agent swarms to do real work while responsibly (irresponsibly) optimizing token burn. Turns out all it takes is dropping Markdown config files into Cursor + one orchestration rule.

## Inspiration

Adapted from **[oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode)** (32k+ stars) — agent specialization, parallel dispatch, phased orchestration — applied to Cursor's native `Task` subagents. No plugin system, no wrapper CLI.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tmcfarlane/oh-my-cursor&type=date&legend=top-left)](https://www.star-history.com/#tmcfarlane/oh-my-cursor&type=date&legend=top-left)

## Contributing

Contributions that improve clarity, behavior, or docs are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Local development:** Clone the repo and run `bash install.sh` (macOS/Linux) or `.\install.ps1` (Windows) to install from source. Changes to agents, rules, commands, or hooks take effect after reinstalling.

## Security

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE) - _Steal It Respectfully!_
