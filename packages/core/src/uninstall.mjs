// Uninstall a pack using the lockfile: remove exactly the files we wrote (+ our git
// hook), prune now-empty directories, and drop the install entry.
import { existsSync, rmSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { pruneEmptyDirsRecursive } from "./util.mjs";
import { lockPath, readLock, writeLock, removeLockIfEmpty, findInstall } from "./lock.mjs";
import { primaryCursorDir, toolDir } from "./paths.mjs";

export function uninstallPack({ packId, scope = "user", home = homedir(), repo = process.cwd(), dryRun = false }) {
  const pathOpts = { home, repo };
  const cursorDir = primaryCursorDir(scope, pathOpts);
  const path = lockPath(cursorDir);
  const lock = readLock(path);
  const install = findInstall(lock, packId, scope);

  if (!install) return { notFound: true, removed: 0 };

  const summary = { removed: 0, gitHook: false, dryRun };

  for (const f of install.files || []) {
    if (existsSync(f.path)) {
      if (!dryRun) rmSync(f.path);
      summary.removed++;
    }
  }

  for (const extra of install.extraPaths || []) {
    if (existsSync(extra) && readFileSync(extra, "utf8").includes("oh-my-cursor")) {
      if (!dryRun) rmSync(extra);
      summary.gitHook = true;
      summary.removed++;
    }
  }

  if (!dryRun) {
    lock.installs = (lock.installs || []).filter(
      (i) => !(i.packId === packId && i.scope === scope),
    );
    writeLock(path, lock);
    removeLockIfEmpty(path);
    // Prune every now-empty directory in each tool dir we wrote to — leave no trace.
    for (const tool of install.tools || ["cursor"]) {
      pruneEmptyDirsRecursive(toolDir(tool, scope, pathOpts));
    }
  }

  return summary;
}
