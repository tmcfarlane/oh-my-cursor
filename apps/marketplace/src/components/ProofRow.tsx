import { StatusMark } from "../components/StatusMark";
import type { PlanItem } from "../lib/types";

/**
 * One typeset diff line in the galley proof.
 * Proofreader's margin glyph + monospace file path, set tight like a proof sheet.
 * Unchanged lines are ghosted; user-modified lines carry a margin slip about the backup.
 */
export function ProofRow({ item, collapsed = false }: { item: PlanItem; collapsed?: boolean }) {
  const ghosted = item.status === "unchanged";

  return (
    <li
      className={`flex items-baseline gap-2 leading-tight tabular ${ghosted ? "opacity-50" : ""}`}
      data-collapsed={collapsed || undefined}
    >
      <span className="shrink-0 translate-y-px">
        <StatusMark status={item.status} />
      </span>
      <code className="min-w-0 truncate font-mono text-[0.8125rem] text-ink">{item.rel}</code>
      {item.status === "userModified" && (
        <span className="ml-1 shrink-0 font-mono text-[0.6875rem] text-[var(--omc-status-usermod)]">
          → backed up to *.omc-bak (never overwritten)
        </span>
      )}
    </li>
  );
}
