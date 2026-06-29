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
import { WaxSeal } from "../components/WaxSeal";
import { StatusMark } from "../components/StatusMark";

const GROUP_ORDER: PlanItem["group"][] = ["agents", "rules", "commands", "hooks", "config", "skills"];
const COUNT_ORDER: { status: FileStatus; key: "new" | "update" | "unchanged" | "userModified" }[] = [
  { status: "new", key: "new" },
  { status: "update", key: "update" },
  { status: "unchanged", key: "unchanged" },
  { status: "userModified", key: "userModified" },
];

/**
 * THE SIGNATURE SCREEN — the galley proof ("/pack/:id/install/proof").
 * A non-mutating gate: read the typeset diff, weigh the trust surface, then press the
 * wax seal to ARM the press. Deep-link safe — builds its own PlanRequest from
 * useParams().id + useInstallTarget() and calls api.plan() itself.
 */
export default function GalleyProof() {
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

  // Re-group plan items by tool → group, preserving the editorial group order.
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
        <span className="omc-kicker">Galley Proof · non-mutating</span>
        <h1 className="mt-2 font-display text-[2.75rem] font-semibold leading-[0.95] tracking-[-0.02em] text-[var(--omc-text)]">
          Read the proof
        </h1>
        <p className="mt-3 max-w-xl font-body text-[var(--omc-muted)]">
          Nothing is written until you approve. Inspect every line, then press the seal to arm the press.
        </p>
      </header>

      {/* ── Loading / error states ─────────────────────────────────────── */}
      {plan.loading && (
        <p className="mt-8 font-mono text-[0.85rem] text-[var(--omc-muted)]">Pulling the proof sheet…</p>
      )}

      {plan.error && !plan.loading && (
        <div
          role="alert"
          className="omc-rule mt-8 bg-[var(--omc-danger)]/10 px-4 py-3 font-mono text-[0.8rem] text-[var(--omc-danger)]"
        >
          <p className="font-bold">Could not set the proof.</p>
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
          {/* ── Running head: counts + literal CLI echo ─────────────────── */}
          <section aria-label="Proof summary" className="omc-rule mt-8 pt-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[0.82rem] text-[var(--omc-text)]">
              {COUNT_ORDER.map(({ status, key }, i) => (
                <span key={status} className="inline-flex items-center gap-1.5">
                  {i > 0 && (
                    <span aria-hidden="true" className="mr-2.5 text-[var(--omc-rule)]">
                      ·
                    </span>
                  )}
                  <StatusMark status={status} />
                  <span className="tabular font-bold">{summary[key]}</span>
                  <span className="text-[var(--omc-muted)]">{STATUS_MARK[status].label}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--omc-muted)]">
              {pluralize(summary.total, "file")} typeset
            </p>
            <div className="mt-4">
              <CliEcho request={req} verb="plan" />
            </div>
          </section>

          {/* ── The proof: tool → group → typeset diff lines ─────────────── */}
          <section aria-label="Galley proof" className="mt-10 flex flex-col gap-10">
            {grouped.map(({ tool, groups }) => (
              <div key={tool}>
                <h2 className="font-mono text-[0.74rem] font-bold uppercase tracking-[0.18em] text-[var(--omc-accent-ink)]">
                  {tool}
                </h2>
                <div className="mt-4 flex flex-col gap-6 border-l border-[var(--omc-rule)] pl-4">
                  {groups.map(({ group, changed, unchanged }) => (
                    <div key={group}>
                      <h3 className="font-mono text-[0.64rem] uppercase tracking-[0.16em] text-[var(--omc-muted)]">
                        {GROUP_LABEL[group] ?? group}
                      </h3>
                      {changed.length > 0 && (
                        <ol className="mt-2 flex flex-col gap-1">
                          {changed.map((item) => (
                            <ProofRow key={`${item.tool}:${item.rel}`} item={item} />
                          ))}
                        </ol>
                      )}
                      {unchanged.length > 0 && (
                        <details className="mt-2 group">
                          <summary className="omc-focusable cursor-pointer list-none font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[var(--omc-muted)] hover:text-[var(--omc-text)]">
                            <span aria-hidden="true">▸ </span>
                            {unchanged.length} unchanged (set as-is)
                          </summary>
                          <ol className="mt-2 flex flex-col gap-1">
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
          </section>

          {/* ── Verdicts: git hook honesty + trust surface ───────────────── */}
          <section aria-label="Verdicts" className="omc-rule mt-10 pt-6">
            <span className="omc-kicker">Verdicts</span>
            <div className="mt-3">
              <GitVerdictStamp gitPreCommit={plan.data.gitPreCommit} scope={scope} tools={tools} />
            </div>
            <div className="mt-5">
              {pack.loading && (
                <p className="font-mono text-[0.72rem] text-[var(--omc-muted)]">Reading the trust surface…</p>
              )}
              {pack.error && !pack.loading && (
                <p className="font-mono text-[0.72rem] text-[var(--omc-danger)]">
                  Trust surface unavailable — {pack.error}
                </p>
              )}
              {pack.data && <TrustStamps permissions={pack.data.permissions} />}
            </div>
          </section>

          {/* ── The press: approve seal → armed CTA ──────────────────────── */}
          <section aria-label="Approve and press" className="omc-rule mt-10 flex flex-col gap-5 pt-6">
            {upToDate ? (
              <div
                role="status"
                className="inline-flex max-w-max flex-col items-start rounded-[var(--omc-radius-stamp)] border-2 px-3 py-2"
                style={{ borderColor: "var(--omc-success)", color: "var(--omc-success)", transform: "rotate(-0.75deg)" }}
              >
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] opacity-80">No changes</span>
                <span className="font-mono text-[0.9rem] font-bold uppercase tracking-[0.06em]">Already up to date</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-6">
                <WaxSeal approved={approved} onApprove={() => setApproved(true)} />
                <p className="max-w-xs font-body text-[0.85rem] text-[var(--omc-muted)]">
                  {approved
                    ? "Proof approved. The press is armed — send it through."
                    : "Press the seal to approve this proof and arm the press."}
                </p>
              </div>
            )}

            {installError && (
              <p role="alert" className="font-mono text-[0.76rem] text-[var(--omc-danger)] break-words">
                Install failed — {installError}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={sendToPress}
                disabled={!canPress}
                aria-disabled={!canPress}
                className="omc-focusable inline-flex items-center gap-2 rounded-[var(--omc-radius)] px-5 py-2.5 font-body text-[0.92rem] font-semibold text-[var(--omc-surface)] transition-[transform,box-shadow] disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--omc-accent)", boxShadow: "var(--omc-shadow-1)" }}
              >
                {installing ? "Sending to press…" : "Send to Press"}
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
                Disarmed — approve the proof to enable
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
