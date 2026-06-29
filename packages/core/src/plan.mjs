// Build an install plan: resolve pack content -> destination files for each tool,
// honoring the same scope/tool rules the shell installer uses, and diff against the
// current filesystem (+ prior lockfile) to classify each file.
//
// Parity with install.sh:
//   - agents/rules/commands/hooks  -> every requested tool dir
//   - config (hooks.json/permissions.json) -> cursor + project scope only
//   - skills -> cursor primary dir only (not mirrored to claude/codex)
//   - git pre-commit hook -> project scope + cursor only, and only if no foreign hook exists
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { listFiles, matchGlobs, sha256 } from "./util.mjs";
import { toolDir, primaryCursorDir } from "./paths.mjs";
import { findInstall } from "./lock.mjs";

const FILE_GROUPS = ["agents", "rules", "commands", "hooks", "config"];

function classify(src, dest, priorSha) {
  if (!existsSync(dest)) return "new";
  const destSha = sha256(dest);
  if (destSha === sha256(src)) return "unchanged";
  if (priorSha && destSha !== priorSha) return "userModified";
  return "update";
}

export function planInstall({ pack, sourceRoot }, opts = {}, lock = { installs: [] }) {
  const scope = opts.scope || "user";
  const tools = opts.tools || ["cursor"];
  const home = opts.home;
  const repo = opts.repo || process.cwd();
  const pathOpts = { home, repo };

  const prior = findInstall(lock, pack.id, scope);
  const priorByPath = new Map((prior?.files || []).map((f) => [f.path, f.sha256]));

  const contentFiles = listFiles(sourceRoot);
  const items = [];

  for (const tool of tools) {
    const dir = toolDir(tool, scope, pathOpts);

    for (const group of FILE_GROUPS) {
      if (group === "config" && !(tool === "cursor" && scope === "project")) continue;
      const matched = matchGlobs(contentFiles, pack.contents?.[group] || []);
      for (const rel of matched) {
        const src = join(sourceRoot, rel);
        const dest = join(dir, rel);
        items.push({ tool, group, rel, src, dest, status: classify(src, dest, priorByPath.get(dest)) });
      }
    }

    if (tool === "cursor") {
      for (const skill of pack.skills || []) {
        const skillRoot = join(sourceRoot, "skills", skill.name);
        for (const f of listFiles(skillRoot)) {
          const rel = `skills/${skill.name}/${f}`;
          const src = join(sourceRoot, rel);
          const dest = join(dir, rel);
          items.push({ tool, group: "skills", rel, src, dest, status: classify(src, dest, priorByPath.get(dest)) });
        }
      }
    }
  }

  const gitPreCommit = planGitHook(pack, scope, tools, repo);

  return {
    packId: pack.id,
    version: pack.version,
    scope,
    tools,
    repo,
    home,
    primaryCursorDir: primaryCursorDir(scope, pathOpts),
    items,
    gitPreCommit,
    activation: pack.activation || null,
  };
}

function planGitHook(pack, scope, tools, repo) {
  const declares = (pack.uninstall?.extraPaths || []).some((p) => p.includes("pre-commit"));
  if (!declares || scope !== "project" || !tools.includes("cursor")) return null;
  const path = join(repo, ".git", "hooks", "pre-commit");
  if (!existsSync(join(repo, ".git"))) return { path, willInstall: false, reason: "not a git repo" };
  if (existsSync(path) && !readFileSync(path, "utf8").includes("oh-my-cursor")) {
    return { path, willInstall: false, reason: "existing non-OMC hook" };
  }
  return { path, willInstall: true, reason: null };
}

export function summarize(plan) {
  const by = (s) => plan.items.filter((i) => i.status === s).length;
  return { new: by("new"), update: by("update"), unchanged: by("unchanged"), userModified: by("userModified"), total: plan.items.length };
}
