import type { Permissions } from "../lib/types";

type Tone = "caution" | "clear" | "neutral";

interface PermItem {
  key: string;
  label: string;
  active: boolean;
  tone: Tone;
}

export function TrustStamps({ permissions, compact = false }: { permissions: Permissions; compact?: boolean }) {
  const shell = !!permissions.shellHooks;
  const git = !!permissions.gitHooks;
  const net = !!permissions.network;
  const writes = permissions.writes ?? [];

  const items: PermItem[] = [
    { key: "shell", label: "shell", active: shell, tone: "caution" },
    { key: "git", label: "git", active: git, tone: "caution" },
    { key: "network", label: "network", active: net, tone: "clear" },
  ];

  return (
    <section aria-label="Trust surface" className="flex flex-col gap-2">
      {/* Permissions strip: shell ●  git ●  network ○ */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-[var(--omc-radius-stamp)] border border-rule bg-surface px-3 py-2"
        role="list"
      >
        {items.map(({ key, label, active, tone }) => {
          const dotClass =
            tone === "caution" && active
              ? "text-warning"
              : tone === "clear" && !active
              ? "text-success"
              : "text-[var(--omc-status-unchanged)]";
          const labelClass =
            active
              ? tone === "caution"
                ? "text-warning"
                : "text-success"
              : "text-muted";

          return (
            <span
              key={key}
              role="listitem"
              className="inline-flex items-center gap-1.5 font-mono text-[0.72rem]"
              aria-label={`${label}: ${active ? "yes" : "none"}`}
            >
              <span className={`text-[0.6rem] ${dotClass}`} aria-hidden="true">
                {active ? "●" : "○"}
              </span>
              <span className={labelClass}>{label}</span>
            </span>
          );
        })}
      </div>

      {/* Writes paths — mono well expander, hidden in compact mode */}
      {!compact && writes.length > 0 && (
        <details>
          <summary className="omc-focusable cursor-pointer list-none font-mono text-[0.7rem] uppercase tracking-[0.1em] text-muted hover:text-ink transition-colors duration-[120ms]">
            writes → {writes.length} path{writes.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-1.5 rounded-[var(--omc-radius-stamp)] border border-rule bg-sunken px-3 py-2 space-y-1">
            {writes.map((w) => (
              <li key={w} className="font-mono text-[0.72rem] text-ink break-all">
                {w}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
