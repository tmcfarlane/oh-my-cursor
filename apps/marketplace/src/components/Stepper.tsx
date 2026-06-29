type Stop = "configure" | "proof" | "press";

const STOPS: { key: Stop; folio: string; label: string }[] = [
  { key: "configure", folio: "01", label: "Configure" },
  { key: "proof", folio: "02", label: "Proof" },
  { key: "press", folio: "03", label: "Press" },
];

/**
 * Letterpress 3-stop edition stepper: CONFIGURE → PROOF → PRESS.
 * Space Mono small-caps with folio numerals; the current stop is inked
 * (ink text + vermillion tick/underline), the rest are muted.
 */
export function Stepper({ current }: { current: Stop }) {
  return (
    <nav aria-label="Install progress">
      <ol className="flex flex-wrap items-baseline gap-x-1 gap-y-2 font-mono text-[0.72rem] uppercase tracking-[0.14em]">
        {STOPS.map((stop, i) => {
          const isCurrent = stop.key === current;
          return (
            <li key={stop.key} className="flex items-baseline gap-1">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className="inline-flex items-baseline gap-1.5 pb-1"
                style={{
                  color: isCurrent ? "var(--omc-text)" : "var(--omc-muted)",
                  borderBottom: isCurrent
                    ? "2px solid var(--omc-accent)"
                    : "2px solid transparent",
                }}
              >
                {isCurrent && (
                  <span aria-hidden="true" style={{ color: "var(--omc-accent)" }}>
                    ▸
                  </span>
                )}
                <span
                  className="tabular text-[0.62rem]"
                  style={{ color: isCurrent ? "var(--omc-accent)" : "var(--omc-muted)" }}
                >
                  {stop.folio}
                </span>
                <span className="font-semibold">{stop.label}</span>
              </span>
              {i < STOPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="px-1 text-[var(--omc-rule)]"
                >
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
