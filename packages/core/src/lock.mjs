// The lockfile records every file an install wrote, so uninstall/upgrade are exact.
// Lives at <primaryCursorDir>/.oh-my-cursor/lock.json.
import { readFileSync, writeFileSync, existsSync, rmSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { ensureDir } from "./util.mjs";

export function lockPath(primaryCursorDir) {
  return join(primaryCursorDir, ".oh-my-cursor", "lock.json");
}

export function readLock(path) {
  if (!existsSync(path)) return { schemaVersion: 1, installs: [] };
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return { schemaVersion: 1, installs: [] };
  }
}

export function writeLock(path, lock) {
  ensureDir(dirname(path));
  writeFileSync(path, JSON.stringify(lock, null, 2) + "\n");
}

export function removeLockIfEmpty(path) {
  if (!existsSync(path)) return;
  const lock = readLock(path);
  if ((lock.installs || []).length === 0) {
    rmSync(path);
    const dir = dirname(path);
    try {
      if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true });
    } catch {
      /* ignore */
    }
  }
}

export function findInstall(lock, packId, scope) {
  return (lock.installs || []).find((i) => i.packId === packId && i.scope === scope);
}
