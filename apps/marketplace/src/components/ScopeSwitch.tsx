import type { Scope } from "../lib/types";

interface Props {
  value: Scope;
  onChange: (s: Scope) => void;
  variant?: "bar" | "cards";
}

/** The two editions, in conceptual default order: Project first, then User. */
const EDITIONS: { scope: Scope; label: string; truth: string }[] = [
  { scope: "project", label: "Project", truth: "config + git pre-commit hook install here" },
  { scope: "user", label: "User", truth: "Always-Allow is user-scope-gated" },
];

/**
 * User vs Project "edition" selector. Two rubber-stamp toggles ('bar') or two
 * larger selectable cards each carrying a one-line truth note ('cards').
 * Active = inked (bg-ink text-paper). Project is the conceptual default.
 */
export function ScopeSwitch({ value, onChange, variant = "bar" }: Props) {
  if (variant === "cards") {
    return (
      <div role="group" aria-label="Install edition" className="grid gap-3 sm:grid-cols-2">
        {EDITIONS.map(({ scope, label, truth }, i) => {
          const active = value === scope;
          return (
            <button
              key={scope}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(scope)}
              className={`omc-focusable group flex flex-col items-start rounded-[var(--omc-radius-stamp)] border-2 px-4 py-3 text-left transition-transform duration-150 hover:-translate-y-0.5 ${
                active
                  ? "bg-ink text-paper border-ink shadow-[var(--omc-shadow-lift)]"
                  : "border-rule bg-surface text-ink shadow-[var(--omc-shadow-1)]"
              }`}
              style={{ transform: `rotate(${i === 0 ? -0.6 : 0.6}deg)` }}
            >
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] opacity-75">
                {`No. ${String(i + 1).padStart(2, "0")} Edition`}
              </span>
              <span className="mt-0.5 font-display text-[1.35rem] font-semibold leading-tight">{label}</span>
              <span
                className={`mt-1.5 font-mono text-[0.68rem] leading-snug ${
                  active ? "text-paper/80" : "text-[var(--omc-muted)]"
                }`}
              >
                {truth}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const current = EDITIONS.find((e) => e.scope === value) ?? EDITIONS[0];

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Install edition" className="inline-flex flex-wrap items-center gap-2">
        {EDITIONS.map(({ scope, label }, i) => {
          const active = value === scope;
          return (
            <button
              key={scope}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(scope)}
              className={`omc-focusable rounded-[var(--omc-radius-stamp)] border-2 px-3 py-1.5 font-mono text-[0.74rem] font-bold uppercase tracking-[0.1em] transition-transform duration-150 hover:-translate-y-0.5 ${
                active
                  ? "bg-ink text-paper border-ink shadow-[var(--omc-shadow-1)]"
                  : "border-rule bg-surface text-[var(--omc-muted)] hover:text-ink"
              }`}
              style={{ transform: `rotate(${i === 0 ? -0.8 : 0.8}deg)` }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[0.68rem] leading-snug text-[var(--omc-muted)]">
        <span aria-hidden="true" className="text-accent">
          ›{" "}
        </span>
        {current.truth}
      </p>
    </div>
  );
}
