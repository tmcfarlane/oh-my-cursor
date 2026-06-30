#!/usr/bin/env node
// Local engine bridge: a tiny zero-dependency HTTP server that wraps @oh-my-cursor/core so
// the web frontend can drive real installs against the local filesystem. Bound to localhost
// only. In the eventual Tauri build this is replaced by Rust `invoke` commands calling the
// same engine — the frontend's data contract stays identical.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
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

// OMC_ROOT lets a packaged build (e.g. the Tauri bundle, or a compiled sidecar binary) point
// at bundled pack data, since import.meta.url is meaningless once compiled into a binary.
const REPO_ROOT = process.env.OMC_ROOT
  ? resolve(process.env.OMC_ROOT)
  : resolve(fileURLToPath(import.meta.url), "../../../..");
const REGISTRY = join(REPO_ROOT, "registry", "registry.json");
const PORT = Number(process.env.OMC_BRIDGE_PORT || 8787);
const HOME = homedir();

// This bridge performs real filesystem installs, so only the local frontends may reach it.
// A loopback bind is NOT a browser-origin boundary: wildcard CORS would let any website the
// user visits drive installs/uninstalls cross-origin. Reflect only known origins; validate Host
// (defense against DNS-rebinding).
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "tauri://localhost",
  "http://tauri.localhost",
  "https://tauri.localhost",
]);
const ALLOWED_HOSTS = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);

// Allow no-Origin (vite proxy / server-side), the dev origins, and the Tauri webview — matched
// by SCHEME (tauri://… on macOS/Linux) or the tauri.localhost host (Windows) so it is robust to
// the exact origin string. Real http(s) websites (evil.com) are denied.
function originAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.protocol === "tauri:") return true;
    if (u.hostname === "tauri.localhost") return true;
  } catch {
    return false;
  }
  return false;
}

const badRequest = (msg) => Object.assign(new Error(msg), { status: 400 });

function requireRepo(scope, repo) {
  if (scope !== "project") return;
  if (!repo || !existsSync(repo) || !statSync(repo).isDirectory()) {
    throw badRequest("repo must be an existing directory for project scope");
  }
}

function buildPlan({ id, scope = "user", tools = ["cursor"], repo = process.cwd() }) {
  requireRepo(scope, repo);
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

  "POST /api/uninstall": ({ body }) => {
    const scope = body.scope || "user";
    const repo = body.repo || process.cwd();
    requireRepo(scope, repo);
    return uninstallPack({ packId: body.id, scope, home: HOME, repo, dryRun: !!body.dryRun });
  },

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
  const origin = req.headers.origin;

  // DNS-rebinding guard: only answer requests addressed to our own loopback host.
  if (req.headers.host && !ALLOWED_HOSTS.has(req.headers.host)) {
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "forbidden host" }));
  }

  // CORS: reflect only known local frontends — never wildcard.
  const originOk = originAllowed(origin);
  if (origin && originOk) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(originOk ? 204 : 403);
    return res.end();
  }
  if (!originOk) {
    res.writeHead(403, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "forbidden origin" }));
  }

  const route = matchRoute(req.method, url.pathname);
  if (!route) { res.writeHead(404, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ error: "not found" })); }

  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { /* non-JSON body → treat as empty */ }
    try {
      const out = route.handler({ params: route.params, query: url.searchParams, body });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(out));
    } catch (e) {
      // Client (validation) errors return their message; everything else is opaque so we don't
      // leak absolute paths / internal engine details to the caller.
      const status = e.status === 400 ? 400 : 500;
      if (status === 500) console.error("omc bridge error:", e);
      res.writeHead(status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: status === 400 ? e.message : "internal error" }));
    }
  });
});

// Fail loudly if the port is taken (e.g. a leftover sidecar) instead of looking "started".
server.on("error", (e) => {
  console.error(`omc bridge: cannot listen on 127.0.0.1:${PORT} — ${e.message}`);
  process.exit(1);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`omc engine bridge → http://127.0.0.1:${PORT}  (registry: ${REGISTRY})`);
});
