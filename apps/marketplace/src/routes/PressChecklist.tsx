import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2, Hand, Info } from "lucide-react";
import { Stepper } from "../components/Stepper";
import { useAsync } from "../lib/useAsync";
import { api } from "../lib/api";
import { pluralize } from "../lib/format";
import type { InstallResponse } from "../lib/types";

/** A step that mentions quitting/restarting Cursor — the single most-missed step. */
function isRestartStep(s: string): boolean {
  return /restart|relaunch|reopen|quit|⌘\s*q|cmd\s*\+?\s*q/i.test(s);
}
/** A step that asks the user to click "Always Allow" — user-scope-gated by Cursor. */
function isAllowStep(s: string): boolean {
  return /always[-\s]?allow/i.test(s);
}

/** A physical keycap glyph, letterpressed onto paper. */
function Keycap({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex min-w-[2.6rem] items-center justify-center rounded-[var(--omc-radius-stamp)] border-2 border-[var(--omc-border)] bg-[var(--omc-surface)] px-3 py-2 font-mono text-[1.35rem] font-bold leading-none text-[var(--omc-text)]"
      style={{ boxShadow: "var(--omc-shadow-1)" }}
    >
      {children}
    </span>
  );
}

export default function PressChecklist() {
  const { id = "" } = useParams();
  const location = useLocation();
  const receipt =
    ((location.state as { receipt?: InstallResponse } | null)?.receipt) ?? null;

  // Deep-link safe: always fetch the pack for the verbatim activation.steps.
  const { data, loading, error } = useAsync(() => api.pack(id), [id]);

  const steps = useMemo(() => data?.activation?.steps ?? [], [data]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const tickedCount = steps.reduce((n, _s, i) => (checked[i] ? n + 1 : n), 0);

  function toggle(i: number) {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Stepper current="press" />
      </div>

      <span className="omc-kicker">Activation · Final Press</span>
      <h1 className="mt-2 font-display text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.02em] text-[var(--omc-text)]">
        Tick the last few by hand
      </h1>
      <p className="mt-3 max-w-2xl font-body text-[1.02rem] leading-relaxed text-[var(--omc-muted)]">
        The files are on paper. These remaining steps live inside Cursor itself —
        so you get to press them.
      </p>

      {/* Receipt line — only when we arrived fresh from an install. */}
      {receipt && (
        <div className="omc-rule mt-6 bg-[var(--omc-surface-sunken)] px-4 py-3">
          <p className="flex items-center gap-2 font-mono text-[0.78rem] text-[var(--omc-text)] tabular">
            <CheckCircle2
              aria-hidden="true"
              className="size-4 shrink-0 text-[var(--omc-success)]"
            />
            <span>
              {receipt.result.installed} installed
              <span className="mx-1.5 text-[var(--omc-rule)]">·</span>
              {receipt.result.updated} updated
              <span className="mx-1.5 text-[var(--omc-rule)]">·</span>
              {receipt.result.backedUp} backed up
              <span className="mx-1.5 text-[var(--omc-rule)]">·</span>
              {receipt.result.gitHook ? "git hook" : "no git hook"}
            </span>
          </p>
          {receipt.lockfile && (
            <p className="mt-1.5 pl-6 font-mono text-[0.68rem] break-all text-[var(--omc-muted)]">
              {receipt.lockfile}
            </p>
          )}
        </div>
      )}

      {/* Honest note about the limits of automation. */}
      <p
        role="note"
        className="mt-6 flex items-start gap-2 font-body text-[0.92rem] leading-relaxed text-[var(--omc-muted)]"
      >
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--omc-teal)]" />
        <span>
          The installer guides and verifies these, but Cursor cannot let it click
          Always-Allow or restart for you. A human hand finishes the press.
        </span>
      </p>

      {/* Loading / error / empty / list */}
      {loading && (
        <p className="mt-8 font-mono text-[0.82rem] text-[var(--omc-muted)]">
          Fetching the activation checklist…
        </p>
      )}

      {error && !loading && (
        <p
          role="alert"
          className="mt-8 font-mono text-[0.82rem] text-[var(--omc-danger)]"
        >
          <span aria-hidden="true" className="mr-1.5">
            ⊘
          </span>
          Couldn&rsquo;t load the checklist — {error}
        </p>
      )}

      {!loading && !error && steps.length === 0 && (
        <div className="omc-rule mt-8 flex items-center gap-2 py-6 font-body text-[0.95rem] text-[var(--omc-muted)]">
          <Hand aria-hidden="true" className="size-4 shrink-0 text-[var(--omc-success)]" />
          <span>Nothing left to tick — this pack activates the moment it lands. You&rsquo;re set.</span>
        </div>
      )}

      {!loading && !error && steps.length > 0 && (
        <>
          <div className="omc-rule mt-8 mb-4 flex items-baseline justify-between">
            <span className="omc-kicker">By Your Hand</span>
            <span className="font-mono text-[0.7rem] text-[var(--omc-muted)] tabular">
              {tickedCount}/{steps.length} ticked
            </span>
          </div>

          <ol className="flex flex-col gap-3">
            {steps.map((step, i) => {
              const restart = isRestartStep(step);
              const allow = isAllowStep(step);
              const isChecked = !!checked[i];
              const folio = String(i + 1).padStart(2, "0");
              return (
                <li
                  key={`${i}-${step}`}
                  className="rounded-[var(--omc-radius)] border border-[var(--omc-rule)] bg-[var(--omc-surface)]"
                  style={restart ? { borderColor: "var(--omc-border)" } : undefined}
                >
                  <label className="omc-focusable flex cursor-pointer items-start gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(i)}
                      className="omc-focusable mt-1 size-4 shrink-0 accent-[var(--omc-accent)]"
                    />
                    <span
                      aria-hidden="true"
                      className="mt-0.5 font-display text-[1.4rem] font-semibold leading-none tabular"
                      style={{
                        color: isChecked ? "var(--omc-muted)" : "var(--omc-text)",
                      }}
                    >
                      {folio}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block font-body text-[0.96rem] leading-snug text-[var(--omc-text)]"
                        style={
                          isChecked
                            ? { color: "var(--omc-muted)", textDecoration: "line-through" }
                            : undefined
                        }
                      >
                        {step}
                      </span>
                      {allow && (
                        <span className="mt-1 inline-block font-mono text-[0.62rem] uppercase tracking-[0.12em] text-[var(--omc-muted)]">
                          <span aria-hidden="true" className="mr-1 text-[var(--omc-warning)]">
                            ◆
                          </span>
                          user-scope-gated
                        </span>
                      )}
                    </span>
                  </label>

                  {/* The most-missed step gets a large keycap callout. */}
                  {restart && (
                    <div className="flex items-center gap-3 border-t border-[var(--omc-rule)] bg-[var(--omc-surface-sunken)] px-4 py-4">
                      <span className="flex items-center gap-1.5">
                        <Keycap>⌘</Keycap>
                        <span aria-hidden="true" className="font-mono text-[1.1rem] text-[var(--omc-muted)]">
                          +
                        </span>
                        <Keycap>Q</Keycap>
                      </span>
                      <span className="font-body text-[0.85rem] leading-snug text-[var(--omc-muted)]">
                        Fully quit Cursor (not just close the window), then reopen it.
                        This is the step people forget.
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}

      {/* Exits — both honest, both land in the Library. */}
      <div className="omc-rule mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 pt-6">
        <Link
          to="/library"
          className="omc-focusable inline-flex items-center gap-2 rounded-[var(--omc-radius)] bg-[var(--omc-accent)] px-5 py-2.5 font-body text-[0.95rem] font-semibold text-[var(--omc-surface)] transition-transform hover:-translate-y-0.5"
          style={{ boxShadow: "var(--omc-shadow-1)" }}
        >
          Done
          <span aria-hidden="true">→</span>
          Library
        </Link>
        <Link
          to="/library"
          className="omc-focusable font-body text-[0.9rem] text-[var(--omc-muted)] underline decoration-[var(--omc-rule)] underline-offset-4 transition-colors hover:text-[var(--omc-text)]"
        >
          I&rsquo;ll do this later
        </Link>
        {steps.length > 0 && (
          <span className="font-mono text-[0.68rem] text-[var(--omc-muted)] tabular">
            {pluralize(steps.length - tickedCount, "step")} left
          </span>
        )}
      </div>
    </div>
  );
}
