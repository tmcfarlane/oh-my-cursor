import { Outlet } from "react-router-dom";
import { Masthead } from "../components/Masthead";
import { useInstallTarget } from "./InstallTargetContext";
import { useAsync } from "../lib/useAsync";
import { api } from "../lib/api";
import type { Scope } from "../lib/types";

function ScopeChip({ value, scope, onClick }: { value: Scope; scope: Scope; onClick: () => void }) {
  const active = value === scope;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`omc-focusable rounded-[var(--omc-radius)] px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.1em] transition-colors ${
        active
          ? "bg-[var(--omc-text)] text-[var(--omc-bg)]"
          : "text-[var(--omc-muted)] hover:text-[var(--omc-text)]"
      }`}
    >
      {value}
    </button>
  );
}

export function AppShell() {
  const { scope, repo, setScope, setRepo } = useInstallTarget();
  const health = useAsync(() => api.status("user", "."), []);
  const status = useAsync(
    () => api.status(scope, repo || "."),
    [scope, repo],
  );
  const installedCount = status.data?.installs.length ?? 0;
  const offline = !!health.error;

  return (
    <div className="paper-grain relative min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--omc-text)] focus:px-3 focus:py-2 focus:font-mono focus:text-[var(--omc-bg)]"
      >
        Skip to content
      </a>

      <Masthead installedCount={installedCount} />

      {offline && (
        <div
          role="alert"
          className="border-b border-[var(--omc-danger)] bg-[var(--omc-danger)]/10 px-8 py-2 text-center font-mono text-[0.72rem] text-[var(--omc-danger)]"
        >
          Engine bridge offline — run <code className="font-bold">npm run bridge</code> in apps/marketplace, then reload.
        </div>
      )}

      {/* Global install target — every plan/install/status depends on this. */}
      <div className="border-b border-[var(--omc-rule)] bg-[var(--omc-surface)]/60">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-5 gap-y-2 px-8 py-2">
          <span className="omc-kicker">Install Target</span>
          <div className="flex items-center gap-1" role="group" aria-label="Scope">
            <ScopeChip value="user" scope={scope} onClick={() => setScope("user")} />
            <ScopeChip value="project" scope={scope} onClick={() => setScope("project")} />
          </div>
          {scope === "project" && (
            <label className="flex flex-1 items-center gap-2 text-[var(--omc-muted)]">
              <span className="sr-only">Repository path</span>
              <input
                type="text"
                name="repo"
                value={repo}
                spellCheck={false}
                autoComplete="off"
                onChange={(e) => setRepo(e.target.value)}
                placeholder="/path/to/your/repo"
                className="omc-focusable min-w-0 flex-1 rounded-[var(--omc-radius)] border border-[var(--omc-border)] bg-[var(--omc-surface)] px-2.5 py-1 font-mono text-[0.78rem] text-[var(--omc-text)] placeholder:text-[var(--omc-muted)]"
              />
            </label>
          )}
          <span className="font-mono text-[0.66rem] text-[var(--omc-muted)]">
            {scope === "user" ? "~/.cursor" : "<repo>/.cursor"}
          </span>
        </div>
      </div>

      <main id="main" className="relative z-10 mx-auto max-w-[1400px] px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
}
