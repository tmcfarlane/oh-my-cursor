import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Scope, Tool } from "../lib/types";

interface InstallTarget {
  scope: Scope;
  repo: string;
  tools: Tool[];
  recentRepos: string[];
  setScope: (s: Scope) => void;
  setRepo: (r: string) => void;
  setTools: (t: Tool[]) => void;
  rememberRepo: (r: string) => void;
}

const KEY = "omc.recentRepos";
const Ctx = createContext<InstallTarget | null>(null);

function loadRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function InstallTargetProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<Scope>("project");
  const [repo, setRepo] = useState("");
  const [tools, setTools] = useState<Tool[]>(["cursor"]);
  const [recentRepos, setRecentRepos] = useState<string[]>(loadRecents);

  const rememberRepo = useCallback((r: string) => {
    if (!r.trim()) return;
    setRecentRepos((prev) => {
      const next = [r, ...prev.filter((x) => x !== r)].slice(0, 6);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ scope, repo, tools, recentRepos, setScope, setRepo, setTools, rememberRepo }),
    [scope, repo, tools, recentRepos, rememberRepo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInstallTarget(): InstallTarget {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInstallTarget must be used within InstallTargetProvider");
  return ctx;
}
