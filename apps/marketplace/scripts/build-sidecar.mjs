#!/usr/bin/env node
// Compile the engine bridge into a node-free, self-contained Tauri sidecar binary, named for
// the host target triple (Tauri's externalBin convention: <name>-<triple>). Requires `bun`.
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, "..");
const bridge = join(app, "bridge", "server.mjs");
const outDir = join(app, "src-tauri", "binaries");
mkdirSync(outDir, { recursive: true });

const triple = execSync("rustc -vV").toString().match(/host:\s*(\S+)/)?.[1];
if (!triple) throw new Error("could not determine host target triple from `rustc -vV`");

const out = join(outDir, `omc-bridge-${triple}`);
execSync(`bun build "${bridge}" --compile --outfile "${out}"`, { stdio: "inherit" });
console.log(`✓ sidecar → ${out}`);
