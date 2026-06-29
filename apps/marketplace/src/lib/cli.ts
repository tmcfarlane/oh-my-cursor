import type { PlanRequest } from "./types";

type Verb = "plan" | "install" | "uninstall";

/** Render the literal `omc …` command a request maps to — the GUI is a thin wrapper. */
export function buildOmcCommand(req: Pick<PlanRequest, "id" | "scope" | "tools" | "repo"> & { dryRun?: boolean }, verb: Verb): string {
  const parts = ["omc", verb, req.id, `--scope ${req.scope}`];
  if (verb !== "uninstall") parts.push(`--tools ${req.tools.join(",")}`);
  if (req.scope === "project" && req.repo) parts.push(`--repo ${req.repo}`);
  if (req.dryRun) parts.push("--dry-run");
  return parts.join(" ");
}
