// Wire types — mirror exactly what the engine bridge (bridge/server.mjs) returns.

export type Scope = "user" | "project";
export type Tool = "cursor" | "claude" | "codex";
export type FileStatus = "new" | "update" | "unchanged" | "userModified";

export interface Permissions {
  shellHooks?: boolean;
  gitHooks?: boolean;
  network?: boolean;
  writes?: string[];
}

export interface Theme {
  title: string;
  fan?: boolean;
  assets?: string;
}

/** Summary card shape from GET /api/packs. */
export interface PackSummary {
  id: string;
  name: string;
  version: string;
  description: string;
  category: "team" | "role" | "harness" | "theme";
  tags: string[];
  theme: Theme | null;
  permissions: Permissions;
  skillCount: number;
  capabilities: string[];
}

export interface SkillEntry {
  name: string;
  source: string;
  agents?: string[];
}

export interface Activation {
  requiresAlwaysAllow?: boolean;
  requiresRestart?: boolean;
  steps?: string[];
}

/** Full pack.json from GET /api/packs/:id. */
export interface PackDetail extends PackSummary {
  author?: string;
  license?: string;
  homepage?: string;
  models?: { default?: string; overrides?: Record<string, string> };
  skills?: SkillEntry[];
  scopes?: Scope[];
  tools?: Tool[];
  activation?: Activation;
  contents?: Record<string, string[]>;
  requires?: { cursor?: string; packs?: string[] };
}

export interface PlanItem {
  tool: Tool;
  group: "agents" | "rules" | "commands" | "hooks" | "config" | "skills";
  rel: string;
  status: FileStatus;
}

export interface PlanSummary {
  new: number;
  update: number;
  unchanged: number;
  userModified: number;
  total: number;
}

export interface GitPreCommit {
  path: string;
  willInstall: boolean;
  reason: string | null;
}

export interface Plan {
  packId: string;
  version: string;
  scope: Scope;
  tools: Tool[];
  repo: string;
  summary: PlanSummary;
  items: PlanItem[];
  gitPreCommit: GitPreCommit | null;
  activation: Activation | null;
}

export interface InstallResult {
  installed: number;
  updated: number;
  unchanged: number;
  backedUp: number;
  gitHook: boolean;
}

export interface InstallResponse {
  result: InstallResult;
  plan: Plan;
  lockfile: string;
}

export interface UninstallResult {
  removed: number;
  gitHook: boolean;
  dryRun: boolean;
  notFound?: boolean;
}

export interface InstalledPack {
  packId: string;
  version: string;
  scope: Scope;
  tools: Tool[];
  installedAt: string;
  files: { path: string; sha256: string | null }[];
  extraPaths: string[];
}

export interface PlanRequest {
  id: string;
  scope: Scope;
  tools: Tool[];
  repo: string;
  dryRun?: boolean;
}
