// Load a pack manifest and resolve its on-disk source root.
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

export function loadPack(packDir) {
  const manifestPath = join(packDir, "pack.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`No pack.json at ${packDir}`);
  }
  const pack = JSON.parse(readFileSync(manifestPath, "utf8"));
  const sourceRoot = resolve(packDir, pack.sourceRoot || ".");
  return { pack, packDir, sourceRoot };
}

// Resolve a pack from a registry index by id.
export function loadRegistry(registryPath) {
  return JSON.parse(readFileSync(registryPath, "utf8"));
}

export function packDirFromRegistry(registryPath, repoRoot, id) {
  const registry = loadRegistry(registryPath);
  const entry = (registry.packs || []).find((p) => p.id === id);
  if (!entry) throw new Error(`Pack "${id}" not found in registry`);
  return resolve(repoRoot, entry.path);
}
