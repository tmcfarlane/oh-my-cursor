import { AlertTriangle } from "lucide-react";
import type { DerivedAgent } from "../lib/agents";

/**
 * One roster cell in the dramatis personae. A letterpress card: portrait plate,
 * the agent's name set in Fraunces, and a machine-truthful model chip — DIM when the
 * model is inherited, LIT (teal) when this agent overrides it. An invalid Task slug
 * raises a caution flag (it would otherwise silently downgrade to composer-2.5-fast).
 * Skills are tucked under a <details> so the cell stays compact.
 */
export function AgentPortrait({ agent }: { agent: DerivedAgent }) {
  const { name, portrait, model, isOverride, invalidSlug, skills } = agent;

  return (
    <article className="omc-focusable flex flex-col gap-2 rounded-[var(--omc-radius)] border border-edge bg-surface p-3 shadow-[var(--omc-shadow-1)] transition-transform duration-150 ease-out hover:-translate-y-[2px] hover:shadow-[var(--omc-shadow-lift)]">
      <div className="flex items-start gap-3">
        <img
          src={portrait}
          alt={name}
          width={64}
          height={64}
          className="shrink-0 rounded-[var(--omc-radius)] border border-edge bg-sunken object-cover"
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="truncate font-display text-[1.05rem] leading-tight text-ink">{name}</h3>

          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-[var(--omc-radius)] border px-1.5 py-0.5 font-mono text-[0.66rem] tracking-[0.02em] ${
                isOverride
                  ? "border-teal text-teal bg-surface"
                  : "border-rule bg-sunken text-muted"
              }`}
              title={isOverride ? "Per-agent model override" : "Inherits the pack default model"}
            >
              {model}
            </span>

            {invalidSlug && (
              <span
                className="inline-flex items-center gap-1 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-warning"
                title="invalid slug → silently downgrades to composer-2.5-fast"
              >
                <AlertTriangle size={12} strokeWidth={2.25} aria-hidden="true" className="shrink-0" />
                Invalid slug
              </span>
            )}
          </div>
        </div>
      </div>

      {skills.length > 0 && (
        <details className="omc-rule group pt-2">
          <summary className="omc-focusable cursor-pointer list-none font-mono text-[0.64rem] uppercase tracking-[0.12em] text-[var(--omc-accent-ink)] hover:text-[var(--omc-accent)]">
            <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
              ▸{" "}
            </span>
            {skills.length} skill{skills.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 flex flex-col gap-1 border-l-2 border-rule pl-2.5">
            {skills.map((s) => (
              <li key={s} className="font-mono text-[0.7rem] leading-tight text-ink break-words">
                {s}
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
