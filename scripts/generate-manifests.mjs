#!/usr/bin/env node
// Generate plugin.json and skills.json from packs/team-avatar/pack.json.
//
// pack.json is the single source of truth. plugin.json's file arrays are derived from the
// pack's `contents` globs; skills.json is derived from the pack's `skills` provenance list.
// Project-level scalars (plugin name/version/description/...; skills bundled/updated) are
// PRESERVED from the existing files — they are release metadata, not pack-derived.
//
//   node scripts/generate-manifests.mjs          # write the manifests
//   node scripts/generate-manifests.mjs --check   # fail (exit 1) if committed files drift
//
// Zero npm dependencies — runs on plain `node` >= 22.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const PACK = join(ROOT, "packs", "team-avatar", "pack.json");
const CHECK = process.argv.includes("--check");

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const serialize = (obj) => JSON.stringify(obj, null, 2) + "\n";

function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") { out += ".*"; i++; if (glob[i + 1] === "/") i++; }
      else out += "[^/]*";
    } else if (c === "?") out += "[^/]";
    else if (".+^${}()|[]\\".includes(c)) out += "\\" + c;
    else out += c;
  }
  return new RegExp("^" + out + "$");
}

function listFiles(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => join(d.parentPath ?? d.path, d.name))
    .map((p) => p.slice(dir.length + 1).split("\\").join("/"));
}

const pack = readJson(PACK);
const sourceRoot = resolve(join(ROOT, "packs", "team-avatar"), pack.sourceRoot || ".");
const allFiles = listFiles(sourceRoot);

function resolveGroup(group) {
  const patterns = (pack.contents && pack.contents[group]) || [];
  const set = new Set();
  for (const pattern of patterns) {
    const re = globToRegExp(pattern);
    for (const f of allFiles) if (re.test(f)) set.add(f);
  }
  return [...set].sort();
}

// --- plugin.json: preserve scalars, regenerate the file arrays --------------------
const PLUGIN = join(ROOT, "plugin.json");
const existingPlugin = existsSync(PLUGIN) ? readJson(PLUGIN) : {};
const plugin = {
  name: existingPlugin.name ?? "oh-my-cursor",
  version: existingPlugin.version ?? pack.version,
  description: existingPlugin.description ?? pack.description,
  author: existingPlugin.author ?? pack.author,
  repository: existingPlugin.repository ?? pack.homepage,
  license: existingPlugin.license ?? pack.license,
  agents: resolveGroup("agents"),
  rules: resolveGroup("rules"),
  commands: resolveGroup("commands"),
  hooks: resolveGroup("hooks"),
  config: resolveGroup("config"),
};

// --- skills.json: preserve bundled/updated, regenerate skills from pack.skills ----
const SKILLS = join(ROOT, "skills.json");
const existingSkills = existsSync(SKILLS) ? readJson(SKILLS) : {};
const skills = {
  bundled: existingSkills.bundled ?? true,
  updated: existingSkills.updated ?? null,
  skills: (pack.skills || []).map((s) => ({
    name: s.name,
    source: s.source,
    ...(s.agents ? { agents: s.agents } : {}),
  })),
};

const outputs = [
  { path: PLUGIN, label: "plugin.json", content: serialize(plugin) },
  { path: SKILLS, label: "skills.json", content: serialize(skills) },
];

let drift = 0;
for (const { path, label, content } of outputs) {
  const current = existsSync(path) ? readFileSync(path, "utf8") : "";
  if (CHECK) {
    if (current !== content) {
      drift++;
      console.error(`✗ ${label} is out of date — run: node scripts/generate-manifests.mjs`);
    } else {
      console.log(`✓ ${label} up to date`);
    }
  } else {
    if (current !== content) {
      writeFileSync(path, content);
      console.log(`• wrote ${label}`);
    } else {
      console.log(`✓ ${label} unchanged`);
    }
  }
}

if (CHECK && drift) process.exit(1);
