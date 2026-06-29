import type { Permissions } from "../lib/types";

type Tone = "caution" | "clear" | "neutral";

function Stamp({ label, verdict, tone, rotate }: { label: string; verdict: string; tone: Tone; rotate: number }) {
  const color =
    tone === "caution" ? "var(--omc-warning)" : tone === "clear" ? "var(--omc-success)" : "var(--omc-muted)";
  return (
    <div
      className="inline-flex flex-col items-start rounded-[var(--omc-radius-stamp)] border-2 px-2.5 py-1.5"
      style={{ borderColor: color, color, transform: `rotate(${rotate}deg)` }}
      role="img"
      aria-label={`${label}: ${verdict}`}
    >
      <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] opacity-80">{label}</span>
      <span className="font-mono text-[0.82rem] font-bold uppercase tracking-[0.08em] leading-tight">{verdict}</span>
    </div>
  );
}

export function TrustStamps({ permissions, compact = false }: { permissions: Permissions; compact?: boolean }) {
  const shell = !!permissions.shellHooks;
  const git = !!permissions.gitHooks;
  const net = !!permissions.network;
  const writes = permissions.writes ?? [];

  return (
    <section aria-label="Trust surface" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-3">
        <Stamp label="Shell Hooks" verdict={shell ? "Yes" : "No"} tone={shell ? "caution" : "neutral"} rotate={-1.5} />
        <Stamp label="Git Hooks" verdict={git ? "Yes" : "No"} tone={git ? "caution" : "neutral"} rotate={1} />
        <Stamp label="Network" verdict={net ? "Yes" : "None"} tone={net ? "caution" : "clear"} rotate={-0.75} />
      </div>

      {!compact && writes.length > 0 && (
        <details className="group">
          <summary className="omc-focusable cursor-pointer list-none font-mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--omc-accent-ink)] hover:text-[var(--omc-accent)]">
            <span aria-hidden="true">▸ </span>Writes only inside — {writes.length} path{writes.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-2 space-y-1 border-l-2 border-[var(--omc-rule)] pl-3">
            {writes.map((w) => (
              <li key={w} className="font-mono text-[0.72rem] text-[var(--omc-text)] break-words">
                {w}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
