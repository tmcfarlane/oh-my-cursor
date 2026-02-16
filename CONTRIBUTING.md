# Contributing to cursor-agents

Thanks for your interest in contributing. This project is a set of Cursor agent configs and one orchestration rule; contributions that improve clarity, behavior, or docs are welcome.

## How to contribute

- **Bug reports & feature ideas:** Open an [issue](https://github.com/tmcfarlane/cursor-agents/issues).
- **Code/docs changes:** Open a pull request (PR) against `main`.

## Before you submit

1. **Agents & rules:** Keep agent manifests (in `agents/`) and the orchestrator rule (in `rules/`) consistent with the existing style and structure. One role per agent; the orchestrator stays the single always-on rule.
2. **Install script:** If you change file names or layout, update `install.sh` so install (including `--user` / `--project`) still works.
3. **Docs:** Update README (or other docs) if you add agents, change behavior, or change how people install or use the project.

## Pull requests

- Branch from `main`, make focused commits, and target `main` with your PR.
- Describe what you changed and why; link any related issues.
- Ensure the installer still runs (e.g. `bash install.sh --dry-run` or a quick local install test) if you touched `install.sh` or the repo layout.

## License

By contributing, you agree that your contributions will be licensed under the same [MIT License](LICENSE) that covers this project.
