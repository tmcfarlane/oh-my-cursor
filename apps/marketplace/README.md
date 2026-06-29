# The Behavior Catalog

The oh-my-cursor marketplace — a local-first app for browsing, previewing, and installing
Cursor behavior packs. It drives the real `@oh-my-cursor/core` install engine; it never mocks
plan/install data.

Aesthetic: **letterpress ink-on-paper** (Fraunces / Hanken Grotesk / Space Mono). The signature
screen is **The Galley Proof** — the mandatory, non-mutating dry-run diff rendered as a printer's
proof you must approve (the wax seal) before anything is written.

## Architecture

```
React frontend ──HTTP──▶ engine bridge (bridge/server.mjs) ──▶ @oh-my-cursor/core ──▶ filesystem
   (screens)              list/info/plan/install/uninstall/status        (real installs + lockfile)
```

The frontend never changes between web and desktop — only *how the bridge runs* changes:

| Mode | How the bridge runs | Folder picker |
| --- | --- | --- |
| **Web** (`npm run dev`) | `node bridge/server.mjs`, reached via the vite `/api` proxy | path text field |
| **Desktop** (Tauri) | Bun-compiled **node-free sidecar** the Rust shell spawns + kills | native dialog |

`src/lib/tauri.ts` detects Tauri (`window.__TAURI_INTERNALS__`) and switches the API base to the
sidecar (`127.0.0.1:8787`) and enables the native picker. Everything else is identical.

## Run it — web

```bash
npm install
npm run bridge   # terminal 1 — engine bridge on :8787
npm run dev      # terminal 2 — http://localhost:5173
```

## Run it — desktop (Tauri)

Requires Rust (`cargo`) and `bun` (to compile the sidecar).

```bash
npm install
npm run tauri:dev     # compiles the node-free sidecar, then launches the desktop app
npm run tauri:build   # produces a packaged app bundle
```

`tauri:dev` runs `build:sidecar` first (Bun-compiles `bridge/server.mjs` →
`src-tauri/binaries/omc-bridge-<target-triple>`), then `tauri dev`. The Rust shell
(`src-tauri/src/lib.rs`) spawns that sidecar with `OMC_ROOT` pointing at the repo (dev) or the
bundled resource dir (prod), and terminates it on exit.

## The engine binaries

`bridge/server.mjs` and `packages/cli/omc.mjs` both honor `OMC_ROOT` so they can be Bun-compiled
into self-contained binaries that need no Node:

```bash
bun build bridge/server.mjs --compile --outfile omc-bridge   # the desktop sidecar
bun build ../../packages/cli/omc.mjs --compile --outfile omc  # a node-free CLI installer
OMC_ROOT=/path/to/oh-my-cursor ./omc list
```

## Known follow-ups

- **Prod data bundling**: `tauri build` should bundle the pack data (registry + packs + agent/
  skill files) as a resource and point `OMC_ROOT` at it; `tauri:dev` already works via the repo.
- Native menu / auto-update / code-signing are not configured.
