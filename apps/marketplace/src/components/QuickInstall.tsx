import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Loader2, TriangleAlert } from "lucide-react";
import { api } from "../lib/api";
import { useInstallTarget } from "../app/InstallTargetContext";

/**
 * One-click install — the express lane. Installs the pack against the current
 * global install target (scope + tools + repo) without the dry-run review, then
 * lands on the activation receipt. Because it skips the plan preview, it always
 * shows the destination up front, and the reviewed path stays one link away.
 *
 * Project scope needs a repo: when none is set the button is disabled with a hint
 * (the repo lives in the install-target bar). The install is reversible — eject
 * from the Library, and user-edited files are backed up to *.omc-bak.
 */
export function QuickInstall({ packId, divider = true }: { packId: string; divider?: boolean }) {
  const { scope, repo, tools, rememberRepo } = useInstallTarget();
  const navigate = useNavigate();
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsRepo = scope === "project" && !repo.trim();
  const target = scope === "user" ? "~/.cursor" : `${repo.trim() || "<repo>"}/.cursor`;

  async function install() {
    if (installing || needsRepo) return;
    setInstalling(true);
    setError(null);
    try {
      const receipt = await api.install({ id: packId, scope, tools, repo });
      if (scope === "project") rememberRepo(repo);
      navigate(`/pack/${encodeURIComponent(packId)}/activate`, { state: { receipt } });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setInstalling(false);
    }
  }

  return (
    <div className={divider ? "omc-rule pt-6" : undefined}>
      <button
        type="button"
        onClick={install}
        disabled={installing || needsRepo}
        aria-disabled={installing || needsRepo}
        className="omc-focusable inline-flex w-full items-center justify-center gap-2 rounded-[var(--omc-radius)] border px-5 py-3 font-body text-[0.95rem] font-semibold transition-transform disabled:cursor-not-allowed motion-safe:enabled:hover:-translate-y-0.5"
        style={{
          backgroundColor: needsRepo ? "var(--omc-surface-sunken)" : "var(--omc-accent)",
          borderColor: needsRepo ? "var(--omc-rule)" : "var(--omc-accent)",
          color: needsRepo ? "var(--omc-muted)" : "var(--omc-surface)",
          boxShadow: needsRepo ? "none" : "var(--omc-shadow-1)",
        }}
      >
        {installing ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Installing…
          </>
        ) : (
          <>
            <Download aria-hidden="true" className="size-4" strokeWidth={2} />
            Install
          </>
        )}
      </button>

      {/* One-click skips the dry-run, so always show where it lands. */}
      <p className="mt-2 text-center font-mono text-[0.64rem] leading-snug text-[var(--omc-muted)]">
        {needsRepo ? (
          <>
            Set a repository above, or switch to{" "}
            <span className="text-[var(--omc-text)]">User</span> scope
          </>
        ) : (
          <>
            <span aria-hidden="true">→ </span>
            <span className="text-[var(--omc-text)]">{target}</span> · {scope} · {tools.join(", ")}
          </>
        )}
      </p>

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-1.5 font-mono text-[0.7rem] text-[var(--omc-danger)]"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span className="break-words">Install failed — {error}</span>
        </p>
      )}

      <div className="mt-3 text-center">
        <Link
          to={`/pack/${encodeURIComponent(packId)}/install`}
          className="omc-focusable font-mono text-[0.66rem] uppercase tracking-[0.12em] text-[var(--omc-muted)] transition-colors hover:text-[var(--omc-text)]"
        >
          or review the plan first <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
