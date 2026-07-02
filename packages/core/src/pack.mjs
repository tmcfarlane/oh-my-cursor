// Load a pack manifest and resolve its on-disk source root.
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// Lowercase-kebab slug. Also the shape the schema declares for pack id and skill names —
// crucially it forbids "/", "." and "..", which is what keeps these fields from being used
// as path-traversal payloads once the same string is joined into a filesystem destination.
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

// Minimal, security-focused validation of an untrusted manifest. The full JSON-Schema check
// lives in scripts/validate-packs.mjs (CI only); this runs on EVERY install so path-bearing
// fields can never reach the planner unvalidated. Intentionally narrow: it guards the fields
// the engine turns into filesystem paths, not the whole schema.
export function validateManifest(pack, packDir) {
  if (!pack || typeof pack !== "object" || Array.isArray(pack)) {
    throw new Error(`invalid pack.json at ${packDir}: not an object`);
  }
  if (typeof pack.id !== "string" || !SLUG.test(pack.id)) {
    throw new Error(`invalid pack id ${JSON.stringify(pack.id)} at ${packDir}: must match ${SLUG}`);
  }
  for (const skill of pack.skills || []) {
    if (!skill || typeof skill.name !== "string" || !SLUG.test(skill.name)) {
      throw new Error(
        `invalid skill name ${JSON.stringify(skill?.name)} in pack "${pack.id}": must match ${SLUG}`,
      );
    }
  }
}

export function loadPack(packDir) {
  const manifestPath = join(packDir, "pack.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`No pack.json at ${packDir}`);
  }
  const pack = JSON.parse(readFileSync(manifestPath, "utf8"));
  validateManifest(pack, packDir);
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
