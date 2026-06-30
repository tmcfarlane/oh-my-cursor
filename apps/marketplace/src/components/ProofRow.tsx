import { StatusMark } from "../components/StatusMark";
import type { PlanItem } from "../lib/types";

/**
 * One diff line in the plan review.
 * Left-gutter glyph (StatusMark) + status-colored mono path — reads like `git diff`.
 * Unchanged lines use the muted status color; backup note is concise.
 */
export function ProofRow({ item, collapsed = false }: { item: PlanItem; collapsed?: boolean }) {
  const pathColorClass =
    item.status === "new"
      ? "text-[var(--omc-status-new)]"
      : item.status === "update"
        ? "text-[var(--omc-status-update)]"
        : item.status === "userModified"
          ? "text-[var(--omc-status-usermod)]"
          : "text-[var(--omc-status-unchanged)]";

  return (
    <li
      className="flex items-baseline gap-1.5 leading-tight tabular"
      data-collapsed={collapsed || undefined}
    >
      <span className="shrink-0 translate-y-px">
        <StatusMark status={item.status} />
      </span>
      <code className={`min-w-0 truncate font-mono text-[0.8125rem] ${pathColorClass}`}>
        {item.rel}
      </code>
      {item.status === "userModified" && (
        <span className="ml-1 shrink-0 font-mono text-[0.6875rem] text-[var(--omc-status-usermod)]">
          → *.omc-bak
        </span>
      )}
    </li>
  );
}
