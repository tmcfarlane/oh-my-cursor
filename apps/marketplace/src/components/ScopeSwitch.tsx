import type { Scope } from "../lib/types";

interface Props {
  value: Scope;
  onChange: (s: Scope) => void;
  variant?: "bar" | "cards";
}

/** The two scopes, in conceptual default order: Project first, then User. */
const SCOPES: { scope: Scope; label: string; truth: string }[] = [
  { scope: "project", label: "Project", truth: "config + git pre-commit hook install here" },
  { scope: "user", label: "User", truth: "Always-Allow is user-scope-gated" },
];

/**
 * User vs Project scope selector. Two flat toggles ('bar') or two selectable
 * cards each carrying a one-line detail note ('cards').
 * Active = inked (bg-ink text-paper). Project is the conceptual default.
 */
export function ScopeSwitch({ value, onChange, variant = "bar" }: Props) {
  if (variant === "cards") {
    return (
      <div role="group" aria-label="Install scope" className="grid gap-2 sm:grid-cols-2">
        {SCOPES.map(({ scope, label, truth }, i) => {
          const active = value === scope;
          return (
            <button
              key={scope}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(scope)}
              className={`omc-focusable group flex flex-col items-start rounded-[var(--omc-radius-stamp)] border px-4 py-3 text-left transition-colors duration-150 ${
                active
                  ? "bg-ink text-paper border-ink"
                  : "border-[var(--omc-border)] bg-surface text-ink hover:border-[var(--omc-accent-ink)]"
              }`}
            >
              <span
                className="font-mono text-[0.6rem] tabular-nums"
                style={{ color: active ? "var(--omc-bg)" : "var(--omc-muted)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="mt-0.5 font-display text-[1rem] font-semibold leading-tight tracking-tight">
                {label}
              </span>
              <span
                className="mt-1.5 font-mono text-[0.68rem] leading-snug"
                style={{ color: active ? "var(--omc-bg)" : "var(--omc-muted)" }}
              >
                {truth}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const current = SCOPES.find((e) => e.scope === value) ?? SCOPES[0];

  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label="Install scope" className="inline-flex flex-wrap items-center gap-1.5">
        {SCOPES.map(({ scope, label }) => {
          const active = value === scope;
          return (
            <button
              key={scope}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(scope)}
              className={`omc-focusable rounded-[var(--omc-radius-stamp)] border px-3 py-1.5 font-mono text-[0.74rem] font-bold uppercase tracking-[0.1em] transition-colors duration-150 ${
                active
                  ? "bg-ink text-paper border-ink"
                  : "border-[var(--omc-border)] bg-surface text-[var(--omc-muted)] hover:border-[var(--omc-accent-ink)] hover:text-ink"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <p className="font-mono text-[0.68rem] leading-snug text-[var(--omc-muted)]">
        <span aria-hidden="true" className="text-[var(--omc-rule)]">
          ›{" "}
        </span>
        {current.truth}
      </p>
    </div>
  );
}
