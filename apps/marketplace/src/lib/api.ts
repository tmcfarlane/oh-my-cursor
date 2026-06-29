// Thin client for the local engine bridge. In the Tauri build these become `invoke` calls;
// the signatures stay identical so screens don't change.
import type {
  PackSummary,
  PackDetail,
  Plan,
  PlanRequest,
  InstallResponse,
  UninstallResult,
  InstalledPack,
  Scope,
} from "./types";

import { API_BASE } from "./tauri";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let detail: { error?: string } | null = null;
    try {
      detail = (await res.json()) as { error?: string };
    } catch {
      detail = null;
    }
    throw new Error(detail?.error || `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  packs: () => http<{ registry: string; packs: PackSummary[] }>("/api/packs"),
  pack: (id: string) => http<PackDetail>(`/api/packs/${encodeURIComponent(id)}`),
  plan: (req: PlanRequest) =>
    http<Plan>("/api/plan", { method: "POST", body: JSON.stringify(req) }),
  install: (req: PlanRequest) =>
    http<InstallResponse>("/api/install", { method: "POST", body: JSON.stringify(req) }),
  uninstall: (req: { id: string; scope: Scope; repo: string; dryRun?: boolean }) =>
    http<UninstallResult>("/api/uninstall", { method: "POST", body: JSON.stringify(req) }),
  status: (scope: Scope, repo: string) =>
    http<{ scope: Scope; repo: string; installs: InstalledPack[] }>(
      `/api/status?scope=${scope}&repo=${encodeURIComponent(repo)}`,
    ),
};
