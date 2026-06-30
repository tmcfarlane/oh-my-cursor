import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Loader2, PackageMinus, TriangleAlert } from "lucide-react";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { formatDate, pluralize } from "../lib/format";
import { CliEcho } from "../components/CliEcho";
import { useInstallTarget } from "../app/InstallTargetContext";
import type { InstalledPack, PlanRequest, Scope, UninstallResult } from "../lib/types";

/**
 * Library — manage installed packs (route "/library").
 *
 * LOCKFILE-DRIVEN: this reads the engine's status (api.status), NOT the registry. What you see
 * here is exactly what the lockfile records was written for the current scope + repo.
 * The scope switch lives in the AppShell bar; this screen only reads it.
 */
export default function Library() {
  const { scope, repo } = useInstallTarget();
  const target = repo || ".";
  const { data, loading, error, reload } = useAsync(
    () => api.status(scope, target),
    [scope, target],
  );

  const installs = data?.installs ?? [];

  return (
    <section className="max-w-4xl">
      <p className="omc-kicker tabular">Library · {scope}</p>
      <h1 className="mt-2 font-display text-[var(--omc-text-h2)] font-semibold leading-[1.05] tracking-[-0.02em] text-[var(--omc-text)]">
        Installed Packs
      </h1>
      <p className="mt-2 font-mono text-[0.74rem] text-[var(--omc-muted)]">
        Target{" "}
        <span className="text-[var(--omc-text)]">
          {scope === "user" ? "~/.cursor" : `${target}/.cursor`}
        </span>{" "}
        · from lockfile
      </p>

      <div className="mt-8">
        {loading && (
          <p className="font-mono text-[0.82rem] text-[var(--omc-muted)]">Reading the lockfile…</p>
        )}

        {error && !loading && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-[var(--omc-radius)] border border-[var(--omc-danger)] bg-[var(--omc-danger)]/8 px-4 py-3"
          >
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--omc-danger)]" />
            <p className="font-mono text-[0.78rem] text-[var(--omc-danger)]">
              Could not read the lockfile · {error}
            </p>
          </div>
        )}

        {!loading && !error && installs.length === 0 && (
          <div className="omc-rule pt-8 text-center">
            <p className="font-display text-[1.4rem] leading-snug text-[var(--omc-muted)]">
              No packs installed.
            </p>
            <p className="mt-2 font-mono text-[0.78rem] text-[var(--omc-muted)]">
              Nothing recorded for scope={scope}.
            </p>
            <Link
              to="/"
              className="omc-focusable mt-5 inline-block font-mono text-[0.72rem] uppercase tracking-[0.12em] text-[var(--omc-accent)] underline-offset-4 hover:underline"
            >
              Browse the Collection →
            </Link>
          </div>
        )}

        {!loading && !error && installs.length > 0 && (
          <ol className="space-y-px">
            {installs.map((pack) => (
              <InstallRow
                key={`${pack.packId}@${pack.version}`}
                pack={pack}
                scope={scope}
                repo={target}
                onEjected={reload}
              />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

/** One installed pack: header line, expandable file manifest, and a guarded EJECT control. */
function InstallRow({
  pack,
  scope,
  repo,
  onEjected,
}: {
  pack: InstalledPack;
  scope: Scope;
  repo: string;
  onEjected: () => void;
}) {
  // Eject state machine: idle → (dry-run) confirm → (real) ejecting. Never one-click destructive.
  const [confirm, setConfirm] = useState<UninstallResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const request: PlanRequest = { id: pack.packId, scope, tools: pack.tools, repo };

  async function preview() {
    setBusy(true);
    setErr(null);
    try {
      const result = await api.uninstall({ id: pack.packId, scope, repo, dryRun: true });
      setConfirm(result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    setBusy(true);
    setErr(null);
    try {
      await api.uninstall({ id: pack.packId, scope, repo, dryRun: false });
      setConfirm(null);
      onEjected();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function cancel() {
    setConfirm(null);
    setErr(null);
  }

  const fileCount = pack.files.length;

  return (
    <li className="rounded-[var(--omc-radius)] border border-[var(--omc-border)] bg-[var(--omc-surface)] px-5 py-4" style={{ boxShadow: "var(--omc-shadow-1)" }}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[1.2rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--omc-text)]">
            {pack.packId}
            <span className="ml-1.5 font-mono text-[0.82rem] font-normal text-[var(--omc-muted)]">@{pack.version}</span>
          </h2>

          <dl className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[0.7rem] text-[var(--omc-muted)] tabular">
            <div className="flex items-baseline gap-1.5">
              <dt className="uppercase tracking-[0.1em]">Tools</dt>
              <dd className="text-[var(--omc-text)]">{pack.tools.join(", ") || "—"}</dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="uppercase tracking-[0.1em]">Files</dt>
              <dd className="text-[var(--omc-text)]">{fileCount}</dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="uppercase tracking-[0.1em]">Installed</dt>
              <dd className="text-[var(--omc-text)]">{formatDate(pack.installedAt)}</dd>
            </div>
          </dl>
        </div>

        {/* EJECT control — guarded behind a dry-run confirm. */}
        {!confirm && (
          <button
            type="button"
            onClick={preview}
            disabled={busy}
            className="omc-focusable inline-flex shrink-0 items-center gap-1.5 rounded-[var(--omc-radius)] border border-[var(--omc-border)] px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--omc-muted)] transition-colors hover:border-[var(--omc-danger)] hover:text-[var(--omc-danger)] disabled:opacity-50"
          >
            {busy ? (
              <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            ) : (
              <PackageMinus aria-hidden="true" className="size-3.5" />
            )}
            Eject
          </button>
        )}
      </div>

      {/* File manifest — verbatim from the lockfile. */}
      <details className="group mt-3">
        <summary className="omc-focusable inline-flex cursor-pointer list-none items-center gap-1.5 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-[var(--omc-muted)] transition-colors hover:text-[var(--omc-text)]">
          <FileText aria-hidden="true" className="size-3.5" />
          {pluralize(fileCount, "file")}
          {pack.extraPaths.length > 0 && ` + ${pluralize(pack.extraPaths.length, "extra path")}`}
        </summary>
        <div className="mt-2 border-l border-[var(--omc-border)] pl-3">
          <ul className="space-y-0.5">
            {pack.files.map((f) => (
              <li key={f.path} className="flex items-baseline gap-2 leading-tight tabular">
                <code className="min-w-0 truncate font-mono text-[0.74rem] text-[var(--omc-text)]">{f.path}</code>
                {f.sha256 && (
                  <span className="shrink-0 font-mono text-[0.6rem] text-[var(--omc-muted)]" title={f.sha256}>
                    {f.sha256.slice(0, 7)}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {pack.extraPaths.length > 0 && (
            <div className="mt-2">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-[var(--omc-muted)]">Extra paths</p>
              <ul className="mt-0.5 space-y-0.5">
                {pack.extraPaths.map((p) => (
                  <li key={p}>
                    <code className="font-mono text-[0.74rem] text-[var(--omc-muted)]">{p}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>

      {/* Running head — the literal CLI this row maps to. */}
      <div className="mt-3">
        <CliEcho request={request} verb="uninstall" />
      </div>

      {/* Confirm slip — appears only after a dry-run preview; the one honest warning. */}
      {confirm && (
        <div
          role="alertdialog"
          aria-label={`Confirm eject of ${pack.packId}`}
          className="mt-3 rounded-[var(--omc-radius-stamp)] border border-[var(--omc-danger)] bg-[var(--omc-danger)]/6 px-4 py-3"
        >
          {confirm.notFound ? (
            <p className="font-mono text-[0.76rem] text-[var(--omc-muted)]">
              Nothing to remove — not recorded in the lockfile for this scope.
            </p>
          ) : (
            <p className="font-mono text-[0.78rem] text-[var(--omc-text)]">
              <span aria-hidden="true" className="mr-1.5 font-bold text-[var(--omc-danger)]">
                ⊘
              </span>
              Removes exactly what was installed: {pluralize(confirm.removed, "file")}
              {confirm.gitHook && " (incl. git hook)"}.
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            {!confirm.notFound && (
              <button
                type="button"
                onClick={commit}
                disabled={busy}
                className="omc-focusable inline-flex items-center gap-1.5 rounded-[var(--omc-radius)] bg-[var(--omc-danger)] px-3.5 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--omc-bg)] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy && <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />}
                Confirm Eject
              </button>
            )}
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="omc-focusable inline-flex items-center rounded-[var(--omc-radius)] border border-[var(--omc-border)] px-3.5 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--omc-muted)] transition-colors hover:text-[var(--omc-text)] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {err && (
        <p role="alert" className="mt-2 font-mono text-[0.72rem] text-[var(--omc-danger)]">
          <TriangleAlert aria-hidden="true" className="mr-1 inline size-3.5 align-text-bottom" />
          {err}
        </p>
      )}
    </li>
  );
}
