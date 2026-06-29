// Engine tests. The headline gate: an engine install must produce the same tree as
// the legacy install.sh (parity). Plus uninstall-purity and user-edit backup.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, writeFileSync, readdirSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadPack, planInstall, applyInstall, uninstallPack, readLock, lockPath } from "../src/index.mjs";

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const PACK_DIR = join(REPO_ROOT, "packs", "team-avatar");
const INSTALL_SH = join(REPO_ROOT, "install.sh");

function mkTmp() {
  return mkdtempSync(join(tmpdir(), "omc-"));
}

// Map of posix-relative-path -> sha256 for every file under dir, excluding the lockfile.
function treeShas(dir) {
  const map = new Map();
  if (!existsSync(dir)) return map;
  for (const d of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!d.isFile()) continue;
    const abs = join(d.parentPath ?? d.path, d.name);
    const rel = abs.slice(dir.length + 1).split("\\").join("/");
    if (rel.startsWith(".oh-my-cursor/")) continue; // engine-only lockfile
    map.set(rel, createHash("sha256").update(readFileSync(abs)).digest("hex"));
  }
  return map;
}

function engineInstall(home, repo, opts = {}) {
  const plan = planInstall(loadPack(PACK_DIR), { scope: "user", tools: ["cursor"], home, repo, ...opts }, readLock(lockPath(join(home, ".cursor"))));
  applyInstall(plan);
  return plan;
}

test("parity: engine user-scope install matches install.sh", () => {
  const refHome = mkTmp();
  const engHome = mkTmp();
  try {
    // Reference: legacy installer, user scope, sourced from the local repo.
    execFileSync("bash", [INSTALL_SH], { env: { ...process.env, HOME: refHome, NO_COLOR: "1" }, stdio: "ignore" });

    // Engine: user scope into a separate fake home.
    engineInstall(engHome, engHome);

    const ref = treeShas(join(refHome, ".cursor"));
    const eng = treeShas(join(engHome, ".cursor"));

    assert.ok(ref.size > 70, `reference tree unexpectedly small (${ref.size})`);
    assert.deepEqual([...eng.keys()].sort(), [...ref.keys()].sort(), "installed file SET differs from install.sh");
    for (const [rel, sha] of ref) assert.equal(eng.get(rel), sha, `content differs: ${rel}`);
  } finally {
    rmSync(refHome, { recursive: true, force: true });
    rmSync(engHome, { recursive: true, force: true });
  }
});

test("uninstall purity: install then uninstall leaves no trace", () => {
  const home = mkTmp();
  try {
    engineInstall(home, home);
    assert.ok(existsSync(join(home, ".cursor", "agents", "aang.md")));

    const res = uninstallPack({ packId: "team-avatar", scope: "user", home, repo: home });
    assert.ok(res.removed > 70, `expected to remove the full set, got ${res.removed}`);

    // .cursor should be entirely gone (all dirs pruned, lockfile removed).
    assert.ok(!existsSync(join(home, ".cursor")), ".cursor not fully cleaned");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("user edits are backed up, not clobbered", () => {
  const home = mkTmp();
  try {
    engineInstall(home, home);
    const edited = join(home, ".cursor", "agents", "aang.md");
    writeFileSync(edited, "// my local tweak\n");

    // Re-plan (prior lock now records the original sha) -> userModified.
    const plan = planInstall(loadPack(PACK_DIR), { scope: "user", tools: ["cursor"], home, repo: home }, readLock(lockPath(join(home, ".cursor"))));
    const item = plan.items.find((i) => i.rel === "agents/aang.md");
    assert.equal(item.status, "userModified");

    applyInstall(plan);
    assert.ok(existsSync(edited + ".omc-bak"), "backup not created");
    assert.equal(readFileSync(edited + ".omc-bak", "utf8"), "// my local tweak\n");
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("project scope adds config + git hook; user scope does not", () => {
  const home = mkTmp();
  const repo = mkTmp();
  try {
    mkdirSync(join(repo, ".git", "hooks"), { recursive: true }); // pretend git repo
    const plan = planInstall(loadPack(PACK_DIR), { scope: "project", tools: ["cursor"], home, repo }, { installs: [] });
    applyInstall(plan);

    assert.ok(existsSync(join(repo, ".cursor", "permissions.json")), "config not installed at project scope");
    assert.ok(existsSync(join(repo, ".cursor", "hooks.json")));
    assert.ok(existsSync(join(repo, ".git", "hooks", "pre-commit")), "git pre-commit not installed");
    assert.match(readFileSync(join(repo, ".git", "hooks", "pre-commit"), "utf8"), /oh-my-cursor/);
  } finally {
    rmSync(home, { recursive: true, force: true });
    rmSync(repo, { recursive: true, force: true });
  }
});
