interface Props {
  fan: boolean;
  title?: string;
  showDisclaimer?: boolean;
}

/**
 * Wax-mark imprint keyed to a theme's `fan` flag. This reflects IP provenance only —
 * NOT a cryptographic verification (the engine exposes no signature field), so it never
 * claims "verified".
 * fan=false → "FIRST-PARTY" (teal). fan=true → "COMMUNITY ZINE · PARODY" (warning) plus
 * an optional transformative-use disclaimer line.
 */
export function FanImprint({ fan, title, showDisclaimer = false }: Props) {
  const color = fan ? "var(--omc-warning)" : "var(--omc-accent-ink)";
  const verdict = fan ? "Community Zine · Parody" : "First-Party";
  const label = fan ? "Imprint" : "Provenance";
  const subject = title?.trim() || "This pack";

  return (
    <section aria-label="Imprint" className="flex flex-col gap-2">
      <div
        className="inline-flex w-fit flex-col items-start rounded-[var(--omc-radius-stamp)] border-2 px-2.5 py-1.5"
        style={{ borderColor: color, color, transform: "rotate(-1.25deg)" }}
        role="img"
        aria-label={`${label}: ${verdict}`}
      >
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] opacity-80">{label}</span>
        <span className="font-mono text-[0.82rem] font-bold uppercase tracking-[0.08em] leading-tight">
          {verdict}
        </span>
      </div>

      {fan && showDisclaimer && (
        <p className="max-w-prose font-body text-[0.72rem] leading-snug text-[var(--omc-muted)]">
          {subject} is a fan/parody homage; trademarks belong to their owners.
        </p>
      )}
    </section>
  );
}
