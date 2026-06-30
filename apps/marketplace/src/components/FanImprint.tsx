interface Props {
  fan: boolean;
  title?: string;
  showDisclaimer?: boolean;
}

/**
 * Provenance badge keyed to a pack's `fan` flag. Reflects IP provenance only —
 * NOT a cryptographic verification (the engine exposes no signature field), so it never
 * claims "verified".
 * fan=false → "First-Party" (muted). fan=true → "Community · Parody" (warning) plus
 * an optional transformative-use disclaimer line.
 */
export function FanImprint({ fan, title, showDisclaimer = false }: Props) {
  const verdict = fan ? "Community · Parody" : "First-Party";
  const label = fan ? "Imprint" : "Provenance";
  const subject = title?.trim() || "This pack";

  return (
    <section aria-label="Imprint" className="flex flex-col gap-2">
      {/* Flat mono badge — hairline border, no tilt, no wax */}
      <div
        className="inline-flex w-fit items-center gap-2 rounded-[var(--omc-radius-stamp)] border border-rule bg-surface px-2.5 py-1"
        role="img"
        aria-label={`${label}: ${verdict}`}
      >
        <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-muted">
          {label}
        </span>
        <span
          className={`font-mono text-[0.72rem] font-medium uppercase tracking-[0.06em] ${fan ? "text-warning" : "text-muted"}`}
        >
          {verdict}
        </span>
      </div>

      {fan && showDisclaimer && (
        <p className="max-w-prose font-mono text-[0.7rem] leading-snug text-muted">
          {subject} is a fan/parody homage; trademarks belong to their owners.
        </p>
      )}
    </section>
  );
}
