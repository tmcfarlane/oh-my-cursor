// Adversarial + lifecycle regression tests for the installer engine. These cover the threat
// model the parity suite doesn't: untrusted third-party manifests (path traversal), first-install
// collisions, upgrade orphans, uninstall of user-edited files, and the git-hook trust surface.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadPack,
  planInstall,
  applyInstall,
  uninstallPack,
  readLock,
  lockPath,
} from "../src/index.mjs";
import { assertWithin } from "../src/util.mjs";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const PACK_DIR = join(REPO_ROOT, "packs", "team-avatar");

const mkTmp = () => mkdtempSync(join(tmpdir(), "omc-harden-"));
const cursorLock = (home) => lockPath(join(home, ".cursor"));

// Write a synthetic pack (manifest + source files) to `root`; sourceRoot defaults to ".".
function writePack(root, manifest, files = {}) {
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, "pack.json"), JSON.stringify(manifest, null, 2));
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
}

const baseManifest = (id, extra = {}) => ({
  schemaVersion: 1,
  id,
  name: id,
  version: "1.0.0",
  category: "role",
  sourceRoot: ".",
  contents: { agents: ["agents/*.md"] },
  permissions: {},
  skills: [],
  ...extra,
});

function installPack(packDir, home, opts = {}) {
  const { pack, sourceRoot } = loadPack(packDir);
  const plan = planInstall(
    { pack, sourceRoot },
    { scope: "user", tools: ["cursor"], home, repo: home, ...opts },
    readLock(cursorLock(home)),
  );
  return { plan, summary: applyInstall(plan) };
}

// ── Path traversal ───────────────────────────────────────────────────────────

test("assertWithin blocks path escapes and allows contained paths", () => {
  const base = join(tmpdir(), "omc-base");
  assert.throws(() => assertWithin(base, join(base, "..", "evil"), "x"), /escapes/);
  assert.throws(() => assertWithin(base, "/etc/passwd", "x"), /escapes/);
  assert.equal(assertWithin(base, join(base, "sub", "f"), "x"), resolve(base, "sub", "f"));
});

test("loadPack rejects a skill name that would traverse out of the install dir", () => {
  const packDir = mkTmp();
  try {
    writePack(
      packDir,
      baseManifest("evil-skill", { skills: [{ name: "../../../../etc", source: "x" }] }),
      { "agents/a.md": "A\n" },
    );
    assert.throws(() => loadPack(packDir), /invalid skill name/i);
  } finally {
    rmSync(packDir, { recursive: true, force: true });
  }
});

test("loadPack rejects a pack id containing path characters", () => {
  const packDir = mkTmp();
  try {
    writePack(packDir, { ...baseManifest("placeholder"), id: "../../evil" }, {});
    assert.throws(() => loadPack(packDir), /invalid pack id/i);
  } finally {
    rmSync(packDir, { recursive: true, force: true });
  }
});

// ── First-install collision ──────────────────────────────────────────────────

test("first install backs up a pre-existing (untracked) user file instead of clobbering it", () => {
  const home = mkTmp();
  try {
    const dest = join(home, ".cursor", "agents", "aang.md");
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, "// pre-existing user content\n");

    const { pack, sourceRoot } = loadPack(PACK_DIR);
    const plan = planInstall(
      { pack, sourceRoot },
      { scope: "user", tools: ["cursor"], home, repo: home },
      readLock(cursorLock(home)),
    );
    const item = plan.items.find((i) => i.rel === "agents/aang.md");
    assert.equal(item.status, "userModified", "a pre-existing collision must classify as userModified");

    const summary = applyInstall(plan);
    assert.ok(existsSync(dest + ".omc-bak"), "no backup of the pre-existing file");
    assert.equal(readFileSync(dest + ".omc-bak", "utf8"), "// pre-existing user content\n");
    assert.ok(summary.backedUp >= 1);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

// ── Upgrade orphans ──────────────────────────────────────────────────────────

test("upgrade removes files the new version dropped and drops them from the lock", () => {
  const packDir = mkTmp();
  const home = mkTmp();
  try {
    writePack(packDir, baseManifest("orphan-demo"), { "agents/a.md": "A\n", "agents/b.md": "B\n" });
    installPack(packDir, home);
    const aPath = join(home, ".cursor", "agents", "a.md");
    const bPath = join(home, ".cursor", "agents", "b.md");
    assert.ok(existsSync(aPath) && existsSync(bPath), "v1 files not installed");

    // v2 no longer ships b.md
    rmSync(join(packDir, "agents", "b.md"));
    const { summary } = installPack(packDir, home);

    assert.ok(!existsSync(bPath), "orphaned b.md not removed on upgrade");
    assert.ok(existsSync(aPath), "a.md wrongly removed");
    assert.equal(summary.orphansRemoved, 1);

    const lock = readLock(cursorLock(home));
    const files = (lock.installs[0].files || []).map((f) => f.path);
    assert.ok(!files.some((p) => p.endsWith("agents/b.md")), "lock still lists the orphan");
  } finally {
    rmSync(packDir, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  }
});

// ── Uninstall preserves user edits ───────────────────────────────────────────

test("uninstall preserves a file the user edited after install", () => {
  const home = mkTmp();
  try {
    const { pack, sourceRoot } = loadPack(PACK_DIR);
    applyInstall(
      planInstall({ pack, sourceRoot }, { scope: "user", tools: ["cursor"], home, repo: home }, { installs: [] }),
    );
    const edited = join(home, ".cursor", "agents", "aang.md");
    writeFileSync(edited, "// user edit after install\n");

    const res = uninstallPack({ packId: "team-avatar", scope: "user", home, repo: home });
    assert.ok(existsSync(edited), "a user-edited file was deleted on uninstall");
    assert.equal(readFileSync(edited, "utf8"), "// user edit after install\n");
    assert.ok(res.keptModified >= 1, "keptModified not reported");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

// ── Git-hook trust surface ───────────────────────────────────────────────────

test("git pre-commit hook is gated on permissions.gitHooks, not uninstall hints", () => {
  const home = mkTmp();
  const repo = mkTmp();
  try {
    mkdirSync(join(repo, ".git", "hooks"), { recursive: true });
    const deceptive = {
      id: "gh",
      version: "1.0.0",
      contents: {},
      skills: [],
      permissions: { gitHooks: false }, // declares NO git hooks…
      uninstall: { extraPaths: ["${gitDir}/hooks/pre-commit"] }, // …but hints at one
    };
    const planned = planInstall(
      { pack: deceptive, sourceRoot: repo },
      { scope: "project", tools: ["cursor"], home, repo },
      { installs: [] },
    );
    assert.equal(planned.gitPreCommit, null, "gitHooks:false must never plan a pre-commit hook");

    const honest = { ...deceptive, permissions: { gitHooks: true } };
    const planned2 = planInstall(
      { pack: honest, sourceRoot: repo },
      { scope: "project", tools: ["cursor"], home, repo },
      { installs: [] },
    );
    assert.ok(planned2.gitPreCommit?.willInstall, "gitHooks:true should plan the hook");
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(repo, { recursive: true, force: true });
  }
});
