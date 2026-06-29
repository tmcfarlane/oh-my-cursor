#!/usr/bin/env node
// Local engine bridge: a tiny zero-dependency HTTP server that wraps @oh-my-cursor/core so
// the web frontend can drive real installs against the local filesystem. Bound to localhost
// only. In the eventual Tauri build this is replaced by Rust `invoke` commands calling the
// same engine — the frontend's data contract stays identical.
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  loadRegistry,
  packDirFromRegistry,
  loadPack,
  planInstall,
  summarize,
  applyInstall,
  uninstallPack,
  readLock,
  lockPath,
  primaryCursorDir,
} from "../../../packages/core/src/index.mjs";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const REGISTRY = join(REPO_ROOT, "registry", "registry.json");
const PORT = Number(process.env.OMC_BRIDGE_PORT || 8787);
const HOME = homedir();

function buildPlan({ id, scope = "user", tools = ["cursor"], repo = process.cwd() }) {
  const { pack, sourceRoot } = loadPack(packDirFromRegistry(REGISTRY, REPO_ROOT, id));
  const dir = primaryCursorDir(scope, { home: HOME, repo });
  const lock = readLock(lockPath(dir));
  const plan = planInstall({ pack, sourceRoot }, { scope, tools, home: HOME, repo }, lock);
  return { pack, plan };
}

// Strip absolute src/dest from plan items for the wire — the UI only needs rel + status.
function wirePlan(plan) {
  return {
    packId: plan.packId,
    version: plan.version,
    scope: plan.scope,
    tools: plan.tools,
    repo: plan.repo,
    summary: summarize(plan),
    items: plan.items.map((i) => ({ tool: i.tool, group: i.group, rel: i.rel, status: i.status })),
    gitPreCommit: plan.gitPreCommit,
    activation: plan.activation,
  };
}

const routes = {
  "GET /api/packs": () => {
    const reg = loadRegistry(REGISTRY);
    const packs = reg.packs.map((entry) => {
      const { pack } = loadPack(packDirFromRegistry(REGISTRY, REPO_ROOT, entry.id));
      return {
        id: pack.id,
        name: pack.name,
        version: pack.version,
        description: pack.description,
        category: pack.category,
        tags: pack.tags || [],
        theme: pack.theme || null,
        permissions: pack.permissions || {},
        skillCount: (pack.skills || []).length,
        capabilities: pack.capabilities || [],
      };
    });
    return { registry: reg.name, packs };
  },

  "GET /api/packs/:id": ({ params }) => {
    const { pack } = loadPack(packDirFromRegistry(REGISTRY, REPO_ROOT, params.id));
    return pack;
  },

  "POST /api/plan": ({ body }) => wirePlan(buildPlan(body).plan),

  "POST /api/install": ({ body }) => {
    const { plan } = buildPlan(body);
    const result = applyInstall(plan, { dryRun: !!body.dryRun });
    return { result, plan: wirePlan(plan), lockfile: lockPath(plan.primaryCursorDir) };
  },

  "POST /api/uninstall": ({ body }) =>
    uninstallPack({ packId: body.id, scope: body.scope || "user", home: HOME, repo: body.repo || process.cwd(), dryRun: !!body.dryRun }),

  "GET /api/status": ({ query }) => {
    const scope = query.get("scope") || "user";
    const repo = query.get("repo") || process.cwd();
    const lock = readLock(lockPath(primaryCursorDir(scope, { home: HOME, repo })));
    return { scope, repo, installs: lock.installs || [] };
  },

  "GET /api/health": () => ({ ok: true, registry: REGISTRY, home: HOME }),
};

function matchRoute(method, pathname) {
  for (const key of Object.keys(routes)) {
    const [m, pattern] = key.split(" ");
    if (m !== method) continue;
    const pParts = pattern.split("/");
    const aParts = pathname.split("/");
    if (pParts.length !== aParts.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pParts.length; i++) {
      if (pParts[i].startsWith(":")) params[pParts[i].slice(1)] = decodeURIComponent(aParts[i]);
      else if (pParts[i] !== aParts[i]) { ok = false; break; }
    }
    if (ok) return { handler: routes[key], params };
  }
  return null;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  const route = matchRoute(req.method, url.pathname);
  if (!route) { res.writeHead(404, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ error: "not found" })); }

  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { /* ignore */ }
    try {
      const out = route.handler({ params: route.params, query: url.searchParams, body });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: e.message }));
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`omc engine bridge → http://127.0.0.1:${PORT}  (registry: ${REGISTRY})`);
});
