import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Stepper } from "../components/Stepper";
import { ScopeSwitch } from "../components/ScopeSwitch";
import { ToolsSelect } from "../components/ToolsSelect";
import { RepoPicker } from "../components/RepoPicker";
import { CliEcho } from "../components/CliEcho";
import { useInstallTarget } from "../app/InstallTargetContext";
import { useAsync } from "../lib/useAsync";
import { api } from "../lib/api";

/**
 * Install Stop 1 — "Configure" (route /pack/:id/install).
 *
 * Configuration screen where the user sets scope, install targets, and repository
 * before generating a dry-run plan. The global install target lives in context
 * (the AppShell carries its own bar) — this screen edits the same source of truth
 * through the controls here, then hands off to the plan review screen.
 */
export default function ConfigureInstall() {
  const { id = "" } = useParams();
  const { scope, repo, tools, recentRepos, setScope, setRepo, setTools, rememberRepo } =
    useInstallTarget();
  const navigate = useNavigate();

  const { data: pack, loading, error, reload } = useAsync(() => api.pack(id), [id]);

  // Lifecycle scripts panel — default OFF. Team Avatar declares no scripts, so the
  // switch is inert and the panel reports the honest truth.
  const [runScripts, setRunScripts] = useState(false);

  const needsRepo = scope === "project" && !repo.trim();
  const request = { id, scope, tools, repo };

  function pullProof() {
    if (needsRepo) return;
    rememberRepo(repo);
    navigate(`/pack/${id}/install/proof`);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Stepper current="configure" />

      <header className="omc-rule pt-5">
        <p className="omc-kicker tabular">Install · Stop 01 · Configure</p>
        {loading ? (
          <h1 className="mt-2 font-display text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.02em] text-[var(--omc-muted)]">
            Loading…
          </h1>
        ) : error ? (
          <h1 className="mt-2 font-display text-[2.5rem] font-semibold leading-[0.98] tracking-[-0.02em] text-ink">
            Configure install
          </h1>
        ) : (
          <h1 className="mt-2 font-display text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.02em] text-ink">
            {pack?.name}
          </h1>
        )}
        <p className="mt-3 max-w-2xl font-body text-[1.02rem] leading-relaxed text-muted">
          Set the scope, choose install targets, and name the repository. Nothing is
          installed yet — the next step generates a dry-run plan you can review before
          anything writes to disk.
        </p>
      </header>

      {error ? (
        <div
          role="alert"
          className="omc-rule flex flex-col items-start gap-3 bg-sunken px-4 py-4"
        >
          <p className="font-mono text-[0.78rem] leading-relaxed text-[var(--omc-danger)]">
            <span aria-hidden="true">⊘ </span>
            Couldn't load this pack — {error}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={reload}
              className="omc-focusable rounded-[var(--omc-radius-stamp)] border border-rule bg-surface px-3 py-1.5 font-mono text-[0.7rem] font-bold uppercase tracking-[0.1em] text-ink transition-transform duration-150 hover:-translate-y-0.5"
            >
              Retry
            </button>
            <Link
              to="/"
              className="omc-focusable font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted transition-colors hover:text-accent"
            >
              ← Back to the collection
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Section 01 — Scope */}
          <section className="flex flex-col gap-3">
            <h2 className="flex items-baseline gap-2.5 font-display text-[1.4rem] font-semibold leading-none text-ink">
              <span className="tabular font-mono text-[0.95rem] text-[var(--omc-muted)]">01</span>
              Scope
            </h2>
            <ScopeSwitch variant="cards" value={scope} onChange={setScope} />
          </section>

          {/* Section 02 — Mirror targets */}
          <section className="omc-rule flex flex-col gap-3 pt-6">
            <h2 className="flex items-baseline gap-2.5 font-display text-[1.4rem] font-semibold leading-none text-ink">
              <span className="tabular font-mono text-[0.95rem] text-[var(--omc-muted)]">02</span>
              Targets
            </h2>
            <ToolsSelect value={tools} onChange={setTools} />
          </section>

          {/* Section 03 — Repository (always shown; required only for Project) */}
          <section className="omc-rule flex flex-col gap-3 pt-6">
            <h2 className="flex items-baseline gap-2.5 font-display text-[1.4rem] font-semibold leading-none text-ink">
              <span className="tabular font-mono text-[0.95rem] text-[var(--omc-muted)]">03</span>
              Repository
            </h2>
            <RepoPicker
              value={repo}
              recentRepos={recentRepos}
              required={scope === "project"}
              onChange={setRepo}
            />
          </section>

          {/* Section 04 — Lifecycle scripts (default OFF) */}
          <section className="omc-rule flex flex-col gap-3 pt-6">
            <h2 className="flex items-baseline gap-2.5 font-display text-[1.4rem] font-semibold leading-none text-ink">
              <span className="tabular font-mono text-[0.95rem] text-[var(--omc-muted)]">04</span>
              Lifecycle Scripts
            </h2>
            <label
              className="omc-focusable flex items-start gap-3 rounded-[var(--omc-radius-stamp)] border border-rule bg-surface px-4 py-3"
              style={{ cursor: "default" }}
            >
              <input
                type="checkbox"
                className="omc-focusable mt-0.5 size-4 shrink-0 accent-[var(--omc-accent)]"
                checked={runScripts}
                disabled
                onChange={(e) => setRunScripts(e.target.checked)}
              />
              <span className="flex flex-col gap-1">
                <span className="font-body text-[0.95rem] font-semibold leading-tight text-ink">
                  Run lifecycle scripts on install
                </span>
                <span className="font-mono text-[0.72rem] leading-snug text-[var(--omc-muted)]">
                  <span aria-hidden="true" className="text-[var(--omc-success)]">
                    ·{" "}
                  </span>
                  No scripts — nothing to run.
                </span>
              </span>
            </label>
            <p className="font-mono text-[0.66rem] leading-snug text-[var(--omc-muted)]">
              Default off. Packs that ship setup hooks would enable this control.
            </p>
          </section>

          {/* CLI echo — the GUI is a thin wrapper over `omc plan`. */}
          <div className="flex flex-col gap-2">
            <span className="omc-kicker tabular">Command</span>
            <CliEcho request={request} verb="plan" />
          </div>

          {/* Press the proof */}
          <div className="omc-rule flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={pullProof}
                disabled={needsRepo}
                aria-describedby={needsRepo ? "proof-hint" : undefined}
                className="omc-focusable inline-flex items-center gap-2 rounded-[var(--omc-radius-stamp)] border border-accent bg-accent px-5 py-2.5 font-body text-[0.95rem] font-semibold text-paper shadow-[var(--omc-shadow-1)] transition-transform duration-150 hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-rule disabled:bg-sunken disabled:text-[var(--omc-muted)] disabled:shadow-none"
              >
                Review the plan
                <ArrowRight aria-hidden="true" className="size-4" strokeWidth={2} />
              </button>
              {needsRepo && (
                <p
                  id="proof-hint"
                  role="alert"
                  className="flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-[var(--omc-warning)]"
                >
                  <span aria-hidden="true">▲</span>
                  Select a repository for project scope
                </p>
              )}
            </div>
            <Link
              to={`/pack/${id}`}
              className="omc-focusable font-mono text-[0.72rem] uppercase tracking-[0.1em] text-muted transition-colors hover:text-accent"
            >
              ← Back to pack
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
