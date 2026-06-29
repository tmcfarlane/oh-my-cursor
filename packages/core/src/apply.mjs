// Execute an install plan: copy files, back up user-modified files, install the git
// pre-commit hook, and record everything in the lockfile.
import { writeFileSync, chmodSync, copyFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { copy, ensureDir, sha256 } from "./util.mjs";
import { lockPath, readLock, writeLock } from "./lock.mjs";

const GIT_HOOK = `#!/usr/bin/env bash
# oh-my-cursor defense-in-depth: catch anti-pattern commits regardless of HOW the commit is made
# (shell, git CLI, or Cursor's native git path). The beforeShellExecution guard only sees shell
# \`git commit\`; this git-native hook covers commits that bypass the shell.
root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
exec "$root/.cursor/hooks/pre-commit-check.sh"
`;

function isExecutable(item) {
  return item.group === "hooks" && item.rel.endsWith(".sh");
}

export function applyInstall(plan, { dryRun = false } = {}) {
  const summary = { installed: 0, updated: 0, unchanged: 0, backedUp: 0, gitHook: false };
  const lockFiles = [];

  for (const item of plan.items) {
    if (item.status === "unchanged") {
      summary.unchanged++;
    } else {
      if (!dryRun) {
        if (item.status === "userModified" && existsSync(item.dest)) {
          copyFileSync(item.dest, item.dest + ".omc-bak");
          summary.backedUp++;
        }
        copy(item.src, item.dest);
        if (isExecutable(item)) chmodSync(item.dest, 0o755);
      } else if (item.status === "userModified") {
        summary.backedUp++;
      }
      if (item.status === "new") summary.installed++;
      else summary.updated++;
    }
    lockFiles.push({ path: item.dest, sha256: dryRun ? null : safeSha(item.dest) });
  }

  const extraPaths = [];
  if (plan.gitPreCommit?.willInstall) {
    if (!dryRun) {
      ensureDir(dirname(plan.gitPreCommit.path));
      writeFileSync(plan.gitPreCommit.path, GIT_HOOK);
      chmodSync(plan.gitPreCommit.path, 0o755);
    }
    extraPaths.push(plan.gitPreCommit.path);
    summary.gitHook = true;
  }

  if (!dryRun) writeLockEntry(plan, lockFiles, extraPaths);

  return summary;
}

function safeSha(path) {
  return existsSync(path) ? sha256(path) : null;
}

function writeLockEntry(plan, files, extraPaths) {
  const path = lockPath(plan.primaryCursorDir);
  const lock = readLock(path);
  lock.installs = (lock.installs || []).filter(
    (i) => !(i.packId === plan.packId && i.scope === plan.scope),
  );
  lock.installs.push({
    packId: plan.packId,
    version: plan.version,
    scope: plan.scope,
    tools: plan.tools,
    installedAt: new Date().toISOString(),
    files,
    extraPaths,
  });
  lock.installs.sort((a, b) => (a.packId + a.scope).localeCompare(b.packId + b.scope));
  writeLock(path, lock);
}
