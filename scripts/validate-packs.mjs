#!/usr/bin/env node
// Zero-dependency validator for oh-my-cursor behavior packs.
//
// Gates (CI + local):
//   1. registry/registry.json validates against packages/schema/registry.schema.json
//   2. every registry pack path exists and contains pack.json
//   3. each pack.json validates against packages/schema/pack.schema.json
//   4. each pack's `contents` globs (resolved against sourceRoot) match >= 1 file
//   5. every model slug in `models` is in packages/schema/valid-slugs.json
//   6. every resolved agent file's frontmatter `model:` is a valid slug
//      (this automates the VALIDATION.md silent-downgrade sweep)
//
// Exits non-zero on any failure. No npm dependencies — runs on plain `node`.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const SCHEMA_DIR = join(ROOT, "packages", "schema");

const errors = [];
const fail = (msg) => errors.push(msg);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`Cannot read/parse JSON: ${path} — ${e.message}`);
    return null;
  }
}

// --- Minimal JSON-Schema validator (the subset our schemas use) ---------------
function validateSchema(value, schema, path, errs) {
  const types = schema.type ? [].concat(schema.type) : null;
  if (types && !types.some((t) => matchesType(value, t))) {
    errs.push(`${path}: expected type ${types.join("|")}, got ${jsType(value)}`);
    return; // further keyword checks are unreliable on a type mismatch
  }
  if ("const" in schema && JSON.stringify(value) !== JSON.stringify(schema.const)) {
    errs.push(`${path}: must equal ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    errs.push(`${path}: ${JSON.stringify(value)} not in enum [${schema.enum.join(", ")}]`);
  }
  if (typeof value === "string") {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errs.push(`${path}: "${value}" does not match pattern /${schema.pattern}/`);
    }
    if (schema.minLength != null && value.length < schema.minLength) {
      errs.push(`${path}: shorter than minLength ${schema.minLength}`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) {
      errs.push(`${path}: fewer than minItems ${schema.minItems}`);
    }
    if (schema.items) {
      value.forEach((v, i) => validateSchema(v, schema.items, `${path}[${i}]`, errs));
    }
  }
  if (isPlainObject(value)) {
    if (schema.minProperties != null && Object.keys(value).length < schema.minProperties) {
      errs.push(`${path}: fewer than minProperties ${schema.minProperties}`);
    }
    for (const req of schema.required || []) {
      if (!(req in value)) errs.push(`${path}: missing required property "${req}"`);
    }
    for (const [k, v] of Object.entries(value)) {
      const sub = schema.properties && schema.properties[k];
      if (sub) {
        validateSchema(v, sub, `${path}.${k}`, errs);
      } else if (schema.additionalProperties === false) {
        errs.push(`${path}: unknown property "${k}"`);
      } else if (isPlainObject(schema.additionalProperties)) {
        validateSchema(v, schema.additionalProperties, `${path}.${k}`, errs);
      }
    }
  }
}

function matchesType(value, t) {
  switch (t) {
    case "integer": return Number.isInteger(value);
    case "number": return typeof value === "number";
    case "string": return typeof value === "string";
    case "boolean": return typeof value === "boolean";
    case "object": return isPlainObject(value);
    case "array": return Array.isArray(value);
    case "null": return value === null;
    default: return false;
  }
}
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const jsType = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

// --- Glob (only the constructs our manifests use: * ** ? literals) ------------
function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        out += ".*";
        i++;
        if (glob[i + 1] === "/") i++;
      } else {
        out += "[^/]*";
      }
    } else if (c === "?") {
      out += "[^/]";
    } else if (".+^${}()|[]\\".includes(c)) {
      out += "\\" + c;
    } else {
      out += c;
    }
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

// --- Slugs --------------------------------------------------------------------
const slugData = readJson(join(SCHEMA_DIR, "valid-slugs.json")) || { valid: [], special: [], knownInvalid: {} };
const validSlugs = new Set([...(slugData.valid || []), ...(slugData.special || [])]);
function checkSlug(slug, where) {
  if (validSlugs.has(slug)) return;
  const hint = slugData.knownInvalid && slugData.knownInvalid[slug]
    ? ` (known-invalid — use "${slugData.knownInvalid[slug]}", it silently downgrades to composer-2.5-fast)`
    : ` (not in valid-slugs.json — an invalid slug silently downgrades to composer-2.5-fast)`;
  fail(`${where}: invalid model slug "${slug}"${hint}`);
}

function extractFrontmatterModel(file) {
  const txt = readFileSync(file, "utf8");
  if (!txt.startsWith("---")) return null;
  const end = txt.indexOf("\n---", 3);
  if (end === -1) return null;
  const m = txt.slice(0, end).match(/^model:\s*(\S+)/m);
  return m ? m[1] : null;
}

// --- Main ---------------------------------------------------------------------
const packSchema = readJson(join(SCHEMA_DIR, "pack.schema.json"));
const registrySchema = readJson(join(SCHEMA_DIR, "registry.schema.json"));
const registry = readJson(join(ROOT, "registry", "registry.json"));

if (registry && registrySchema) {
  const errs = [];
  validateSchema(registry, registrySchema, "registry.json", errs);
  errs.forEach(fail);
}

const packDirs = new Set();
if (registry && Array.isArray(registry.packs)) {
  for (const entry of registry.packs) {
    const packDir = join(ROOT, entry.path || "");
    packDirs.add(packDir);
    if (!existsSync(join(packDir, "pack.json"))) {
      fail(`registry pack "${entry.id}": no pack.json at ${entry.path}`);
    }
  }
}

let validated = 0;
for (const packDir of packDirs) {
  const manifestPath = join(packDir, "pack.json");
  if (!existsSync(manifestPath)) continue;
  const pack = readJson(manifestPath);
  if (!pack) continue;
  const id = pack.id || "(unknown)";

  if (packSchema) {
    const errs = [];
    validateSchema(pack, packSchema, `${id}/pack.json`, errs);
    errs.forEach(fail);
  }

  const sourceRoot = resolve(packDir, pack.sourceRoot || ".");
  const allFiles = listFiles(sourceRoot);

  // contents globs must each resolve to >= 1 file
  for (const [group, patterns] of Object.entries(pack.contents || {})) {
    for (const pattern of patterns) {
      const re = globToRegExp(pattern);
      const matches = allFiles.filter((f) => re.test(f));
      if (matches.length === 0) {
        fail(`${id}: contents.${group} glob "${pattern}" matched no files under ${pack.sourceRoot || "."}`);
      }
    }
  }

  // declared model slugs
  if (pack.models) {
    if (pack.models.default) checkSlug(pack.models.default, `${id}: models.default`);
    for (const [k, slug] of Object.entries(pack.models.overrides || {})) {
      checkSlug(slug, `${id}: models.overrides.${k}`);
    }
  }

  // agent frontmatter slugs (the real silent-downgrade footgun)
  for (const pattern of (pack.contents && pack.contents.agents) || []) {
    const re = globToRegExp(pattern);
    for (const rel of allFiles.filter((f) => re.test(f))) {
      const slug = extractFrontmatterModel(join(sourceRoot, rel));
      if (slug) checkSlug(slug, `${id}: agent ${rel} frontmatter model`);
    }
  }

  validated++;
}

if (errors.length) {
  console.error(`\n✗ pack validation failed (${errors.length} error${errors.length === 1 ? "" : "s"}):\n`);
  for (const e of errors) console.error(`  • ${e}`);
  console.error("");
  process.exit(1);
}

console.log(`✓ validated ${validated} pack(s) and registry — all manifests, contents, and model slugs OK`);
