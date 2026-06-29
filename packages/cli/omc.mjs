#!/usr/bin/env node
// omc — oh-my-cursor pack installer CLI (thin wrapper over @oh-my-cursor/core).
//
//   omc list
//   omc info <id>
//   omc plan <id> [--scope user|project] [--tools cursor,claude,codex] [--repo <path>]
//   omc install <id> [...same...] [--dry-run]
//   omc uninstall <id> [--scope ...] [--repo ...] [--dry-run]
//   omc status [--scope ...] [--repo ...]
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  loadPack,
  loadRegistry,
  packDirFromRegistry,
  planInstall,
  summarize,
  applyInstall,
  uninstallPack,
  readLock,
  lockPath,
  primaryCursorDir,
} from "../core/src/index.mjs";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const REGISTRY = join(REPO_ROOT, "registry", "registry.json");

function parseArgs(argv) {
  const opts = { scope: "user", tools: ["cursor"], repo: process.cwd(), home: homedir(), dryRun: false };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const take = () => (a.includes("=") ? a.split("=").slice(1).join("=") : argv[++i]);
    if (a === "--dry-run" || a === "-n") opts.dryRun = true;
    else if (a.startsWith("--scope")) opts.scope = take();
    else if (a.startsWith("--tools")) opts.tools = take().split(",").map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith("--repo")) opts.repo = resolve(take());
    else if (a === "-h" || a === "--help") opts.help = true;
    else positional.push(a);
  }
  return { opts, positional };
}

const STATUS_LABEL = { new: "new", update: "update", unchanged: "unchanged", userModified: "user-modified → backup" };

function describePlan(plan) {
  const s = summarize(plan);
  console.log(`\n${plan.packId}@${plan.version}  scope=${plan.scope}  tools=${plan.tools.join(",")}`);
  console.log(`  ${s.new} new · ${s.update} update · ${s.unchanged} unchanged · ${s.userModified} user-modified`);
  for (const item of plan.items) {
    if (item.status === "unchanged") continue;
    console.log(`    [${STATUS_LABEL[item.status]}] ${item.tool}: ${item.rel}`);
  }
  if (plan.gitPreCommit) {
    console.log(
      plan.gitPreCommit.willInstall
        ? `    [git hook] ${plan.gitPreCommit.path}`
        : `    [git hook skipped] ${plan.gitPreCommit.reason}`,
    );
  }
  return s;
}

function printActivation(plan) {
  const a = plan.activation;
  if (!a) return;
  const needs = (plan.scope === "user" && a.requiresAlwaysAllow) || a.requiresRestart;
  if (!needs) return;
  console.log("\n  Activation (Cursor can't do these for you):");
  for (const step of a.steps || []) console.log(`    • ${step}`);
}

function resolvePackDir(id) {
  return packDirFromRegistry(REGISTRY, REPO_ROOT, id);
}

const commands = {
  list() {
    const reg = loadRegistry(REGISTRY);
    console.log(`${reg.name || "registry"} — ${reg.packs.length} pack(s):\n`);
    for (const p of reg.packs) {
      console.log(`  ${p.id}@${p.version}  [${p.category}]  ${p.summary || ""}`);
      if (p.tags?.length) console.log(`      tags: ${p.tags.join(", ")}`);
    }
  },

  info(id) {
    if (!id) return fail("usage: omc info <id>");
    const { pack } = loadPack(resolvePackDir(id));
    console.log(`\n${pack.name} (${pack.id})  v${pack.version}`);
    console.log(`  ${pack.description}`);
    console.log(`  category: ${pack.category}  scopes: ${(pack.scopes || []).join(", ")}  tools: ${(pack.tools || []).join(", ")}`);
    if (pack.permissions) {
      const p = pack.permissions;
      console.log(`  trust: shellHooks=${!!p.shellHooks} gitHooks=${!!p.gitHooks} network=${!!p.network}`);
    }
    console.log(`  skills: ${(pack.skills || []).length}`);
  },

  plan(id, opts) {
    const plan = buildPlan(id, opts);
    describePlan(plan);
    printActivation(plan);
  },

  install(id, opts) {
    const plan = buildPlan(id, opts);
    const s = describePlan(plan);
    if (s.new + s.update + s.userModified === 0 && !plan.gitPreCommit?.willInstall) {
      console.log("\n  Nothing to do — already up to date.");
      return;
    }
    const res = applyInstall(plan, { dryRun: opts.dryRun });
    const verb = opts.dryRun ? "[dry-run] would write" : "wrote";
    console.log(`\n  ${verb}: ${res.installed} installed, ${res.updated} updated, ${res.backedUp} backed up${res.gitHook ? ", git hook" : ""}.`);
    if (!opts.dryRun) console.log(`  lockfile: ${lockPath(plan.primaryCursorDir)}`);
    printActivation(plan);
  },

  uninstall(id, opts) {
    if (!id) return fail("usage: omc uninstall <id>");
    const res = uninstallPack({ packId: id, scope: opts.scope, home: opts.home, repo: opts.repo, dryRun: opts.dryRun });
    if (res.notFound) return console.log(`  No install record for "${id}" (scope=${opts.scope}).`);
    const verb = opts.dryRun ? "[dry-run] would remove" : "removed";
    console.log(`  ${verb} ${res.removed} file(s)${res.gitHook ? " (incl. git hook)" : ""}.`);
  },

  status(_id, opts) {
    const dir = primaryCursorDir(opts.scope, { home: opts.home, repo: opts.repo });
    const lock = readLock(lockPath(dir));
    if (!lock.installs?.length) return console.log(`  No packs installed (scope=${opts.scope}).`);
    console.log(`  Installed (scope=${opts.scope}):\n`);
    for (const i of lock.installs) {
      console.log(`    ${i.packId}@${i.version}  tools=${(i.tools || []).join(",")}  files=${i.files.length}  (${i.installedAt})`);
    }
  },
};

function buildPlan(id, opts) {
  if (!id) fail("missing pack id");
  const { pack, sourceRoot } = loadPack(resolvePackDir(id));
  const dir = primaryCursorDir(opts.scope, { home: opts.home, repo: opts.repo });
  const lock = readLock(lockPath(dir));
  return planInstall({ pack, sourceRoot }, opts, lock);
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const { opts, positional } = parseArgs(process.argv.slice(2));
const [cmd, id] = positional;
if (!cmd || opts.help || !commands[cmd]) {
  console.log("omc <list|info|plan|install|uninstall|status> [id] [--scope] [--tools] [--repo] [--dry-run]");
  process.exit(cmd && !commands[cmd] ? 1 : 0);
}
try {
  commands[cmd](id, opts);
} catch (e) {
  fail(`error: ${e.message}`);
}
