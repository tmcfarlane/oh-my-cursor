// Resolve where a given tool's config lives for a scope.
//   cursor + user    -> ~/.cursor
//   cursor + project -> <repo>/.cursor
//   claude/codex     -> same shape with .claude / .codex
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export const TOOLS = ["cursor", "claude", "codex"];
export const SCOPES = ["user", "project"];

export function toolDir(tool, scope, { home = homedir(), repo = process.cwd() } = {}) {
  const base = scope === "user" ? home : resolve(repo);
  return join(base, `.${tool}`);
}

// The primary cursor dir owns skills, config, the git hook, and the lockfile.
export function primaryCursorDir(scope, opts) {
  return toolDir("cursor", scope, opts);
}
