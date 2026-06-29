// Shared filesystem + glob helpers. Zero dependencies (Node >= 22).
import { createHash } from "node:crypto";
import {
  readFileSync,
  readdirSync,
  existsSync,
  statSync,
  mkdirSync,
  copyFileSync,
  rmdirSync,
} from "node:fs";
import { dirname, join } from "node:path";

// Translate the glob subset our manifests use (* ** ? literals) to a RegExp.
export function globToRegExp(glob) {
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

// List files (recursively) under dir, returned as posix-relative paths.
export function listFiles(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => join(d.parentPath ?? d.path, d.name))
    .map((p) => p.slice(dir.length + 1).split("\\").join("/"));
}

export function matchGlobs(files, patterns) {
  const res = patterns.map(globToRegExp);
  const set = new Set();
  for (const f of files) if (res.some((re) => re.test(f))) set.add(f);
  return [...set].sort();
}

export function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export function copy(src, dest) {
  ensureDir(dirname(dest));
  copyFileSync(src, dest);
}

// Post-order remove every empty directory under `dir` (and `dir` itself if it ends up
// empty). Returns true if `dir` was removed.
export function pruneEmptyDirsRecursive(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return false;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) pruneEmptyDirsRecursive(join(dir, entry.name));
  }
  if (readdirSync(dir).length === 0) {
    rmdirSync(dir);
    return true;
  }
  return false;
}
