import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAsync } from "../lib/useAsync";
import { useInstallTarget } from "../app/InstallTargetContext";
import { STATUS_MARK, GROUP_LABEL, pluralize } from "../lib/format";
import type { FileStatus, PlanItem, PlanRequest } from "../lib/types";
import { Stepper } from "../components/Stepper";
import { CliEcho } from "../components/CliEcho";
import { ProofRow } from "../components/ProofRow";
import { GitVerdictStamp } from "../components/GitVerdictStamp";
import { TrustStamps } from "../components/TrustStamps";
import { ReviewCheckbox } from "../components/ReviewCheckbox";
import { StatusMark } from "../components/StatusMark";

const GROUP_ORDER: PlanItem["group"][] = ["agents", "rules", "commands", "hooks", "config", "skills"];
const COUNT_ORDER: { status: FileStatus; key: "new" | "update" | "unchanged" | "userModified" }[] = [
  { status: "new", key: "new" },
  { status: "update", key: "update" },
  { status: "unchanged", key: "unchanged" },
  { status: "userModified", key: "userModified" },
];

/**
 * THE SIGNATURE SCREEN — the plan review ("/pack/:id/install/proof").
 * A non-mutating gate: read the diff, weigh the trust surface, check the
 * review box, then install. Deep-link safe — builds its own PlanRequest from
 * useParams().id + useInstallTarget() and calls api.plan() itself.
 */
export default function PlanReview() {
  const { id = "" } = useParams();
  const { scope, tools, repo } = useInstallTarget();
  const navigate = useNavigate();

  const req: PlanRequest = useMemo(
    () => ({ id, scope, tools, repo }),
    [id, scope, tools, repo],
  );

  const plan = useAsync(() => api.plan(req), [id, scope, tools.join(","), repo]);
  const pack = useAsync(() => api.pack(id), [id]);

  const [approved, setApproved] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  // Re-group plan items by tool → group, preserving the canonical group order.
  const grouped = useMemo(() => {
    if (!plan.data) return [];
    const byTool = new Map<string, Map<string, PlanItem[]>>();
    for (const tool of plan.data.tools) byTool.set(tool, new Map());
    for (const item of plan.data.items) {
      let groups = byTool.get(item.tool);
      if (!groups) {
        groups = new Map();
        byTool.set(item.tool, groups);
      }
      const bucket = groups.get(item.group) ?? [];
      bucket.push(item);
      groups.set(item.group, bucket);
    }
    return [...byTool.entries()].map(([tool, groups]) => ({
      tool,
      groups: GROUP_ORDER.filter((g) => groups.has(g)).map((g) => {
        const items = groups.get(g)!;
        return {
          group: g,
          changed: items.filter((it) => it.status !== "unchanged"),
          unchanged: items.filter((it) => it.status === "unchanged"),
        };
      }),
    }));
  }, [plan.data]);

  const summary = plan.data?.summary;
  const gitWillWrite = !!plan.data?.gitPreCommit?.willInstall;
  const changeCount = summary ? summary.new + summary.update + summary.userModified : 0;
  const upToDate = !!summary && changeCount === 0 && !gitWillWrite;
  const canPress = approved && !upToDate && !installing && !!plan.data;

  async function sendToPress() {
    if (!canPress) return;
    setInstalling(true);
    setInstallError(null);
    try {
      const res = await api.install(req);
      navigate(`/pack/${id}/activate`, {
        state: { receipt: res },
      });
    } catch (e) {
      setInstallError(e instanceof Error ? e.message : String(e));
      setInstalling(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <Stepper current="proof" />

      <header className="mt-6">
        <span className="omc-kicker">plan · dry-run</span>
        <h1 className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-[var(--omc-text)]">
          Review the plan
        </h1>
        <p className="mt-2 font-mono text-[0.8125rem] text-[var(--omc-muted)]">
          Nothing is written until you install. Review every line below.
        </p>
      </header>

      {/* ── Loading / error states ─────────────────────────────────────── */}
      {plan.loading && (
        <p className="mt-8 font-mono text-[0.85rem] text-[var(--omc-muted)]">Building plan…</p>
      )}

      {plan.error && !plan.loading && (
        <div
          role="alert"
          className="omc-rule mt-8 bg-[var(--omc-danger)]/10 px-4 py-3 font-mono text-[0.8rem] text-[var(--omc-danger)]"
        >
          <p className="font-bold">Could not build the plan.</p>
          <p className="mt-1 break-words opacity-90">{plan.error}</p>
          <button
            type="button"
            onClick={() => plan.reload()}
            className="omc-focusable mt-3 rounded-[var(--omc-radius)] border border-[var(--omc-danger)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.12em] hover:bg-[var(--omc-danger)]/10"
          >
            Try again
          </button>
        </div>
      )}

      {plan.data && summary && (
        <>
          {/* ── Running head + mono diff well ───────────────────────────── */}
          <section aria-label="Plan" className="omc-rule mt-8 pt-5">
            {/* Counts: +N ~N ·N !N */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[0.82rem] text-[var(--omc-text)]">
              {COUNT_ORDER.map(({ status, key }, i) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  {i > 0 && (
                    <span aria-hidden="true" className="mr-2.5 text-[var(--omc-border)]">
                      ·
                    </span>
                  )}
                  <StatusMark status={status} />
                  <span className="tabular font-bold">{summary[key]}</span>
                  <span className="text-[var(--omc-muted)]">{STATUS_MARK[status].label}</span>
                </span>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--omc-muted)]">
              {pluralize(summary.total, "file")}
            </p>
            <div className="mt-3">
              <CliEcho request={req} verb="plan" />
            </div>

            {/* Mono diff well — reads like `git diff` / `terraform plan` */}
            <div className="mt-4 rounded-[var(--omc-radius)] border border-[var(--omc-border)] bg-[var(--omc-surface-sunken)] px-4 py-4">
              <div className="flex flex-col gap-8">
                {grouped.map(({ tool, groups }) => (
                  <div key={tool}>
                    <h2 className="font-mono text-[0.74rem] font-bold uppercase tracking-[0.18em] text-[var(--omc-text)]">
                      {tool}
                    </h2>
                    <div className="mt-3 flex flex-col gap-4 border-l border-[var(--omc-border)] pl-3">
                      {groups.map(({ group, changed, unchanged }) => (
                        <div key={group}>
                          <h3 className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-[var(--omc-muted)]">
                            {GROUP_LABEL[group] ?? group}
                          </h3>
                          {changed.length > 0 && (
                            <ol className="mt-1.5 flex flex-col gap-1">
                              {changed.map((item) => (
                                <ProofRow key={`${item.tool}:${item.rel}`} item={item} />
                              ))}
                            </ol>
                          )}
                          {unchanged.length > 0 && (
                            <details className="mt-1.5 group">
                              <summary className="omc-focusable cursor-pointer list-none font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--omc-muted)] hover:text-[var(--omc-text)]">
                                <span aria-hidden="true">▸ </span>
                                {unchanged.length} unchanged
                              </summary>
                              <ol className="mt-1.5 flex flex-col gap-1">
                                {unchanged.map((item) => (
                                  <ProofRow key={`${item.tool}:${item.rel}`} item={item} collapsed />
                                ))}
                              </ol>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Verdicts: git hook + trust surface ──────────────────────── */}
          <section aria-label="Verdicts" className="omc-rule mt-8 pt-6">
            <span className="omc-kicker">Verdicts</span>
            <div className="mt-3">
              <GitVerdictStamp gitPreCommit={plan.data.gitPreCommit} scope={scope} tools={tools} />
            </div>
            <div className="mt-5">
              {pack.loading && (
                <p className="font-mono text-[0.72rem] text-[var(--omc-muted)]">Loading trust surface…</p>
              )}
              {pack.error && !pack.loading && (
                <p className="font-mono text-[0.72rem] text-[var(--omc-danger)]">
                  Trust surface unavailable — {pack.error}
                </p>
              )}
              {pack.data && <TrustStamps permissions={pack.data.permissions} />}
            </div>
          </section>

          {/* ── Install gate: review checkbox → armed Install button ─────── */}
          <section aria-label="Install gate" className="omc-rule mt-8 flex flex-col gap-5 pt-6">
            {upToDate ? (
              <div
                role="status"
                className="inline-flex max-w-max items-center gap-2 rounded-[var(--omc-radius-stamp)] border border-[var(--omc-success)] px-3 py-1.5"
              >
                <span className="font-mono text-[0.78rem] font-bold text-[var(--omc-success)]">
                  Already up to date
                </span>
                <span className="font-mono text-[0.72rem] text-[var(--omc-muted)]">
                  · no changes
                </span>
              </div>
            ) : (
              <ReviewCheckbox approved={approved} onApprove={() => setApproved(true)} />
            )}

            {installError && (
              <p role="alert" className="break-words font-mono text-[0.76rem] text-[var(--omc-danger)]">
                Install failed — {installError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={sendToPress}
                disabled={!canPress}
                aria-disabled={!canPress}
                className="omc-focusable inline-flex items-center gap-2 rounded-[var(--omc-radius)] border px-5 py-2.5 font-mono text-[0.88rem] font-semibold transition-[transform,box-shadow] disabled:cursor-not-allowed enabled:hover:-translate-y-0.5"
                style={{
                  backgroundColor: canPress ? "var(--omc-accent)" : "var(--omc-surface-sunken)",
                  borderColor: canPress ? "var(--omc-accent)" : "var(--omc-rule)",
                  color: canPress ? "var(--omc-surface)" : "var(--omc-muted)",
                  boxShadow: canPress ? "var(--omc-shadow-1)" : "none",
                }}
              >
                {installing ? "Installing…" : "Install →"}
              </button>
              <Link
                to={`/pack/${id}/install`}
                className="omc-focusable font-mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--omc-muted)] hover:text-[var(--omc-text)]"
              >
                ← Back to configure
              </Link>
            </div>
            {!upToDate && !approved && (
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.12em] text-[var(--omc-muted)]">
                Check the box above to enable install
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
