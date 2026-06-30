import { CATEGORY_LABEL } from "../lib/format";

interface Props {
  category: "team" | "role" | "harness" | "theme";
  folio?: number;
  fan?: boolean;
}

/** Mono category chip with optional muted index prefix and fan variant. */
export function CategoryKicker({ category, folio, fan }: Props) {
  const categoryLabel = CATEGORY_LABEL[category] ?? category;
  return (
    <p className="flex items-center gap-1.5 m-0">
      {/* Tiny muted index — replaces the "No. 0X" folio overline */}
      {folio != null && (
        <span className="font-mono text-[0.65rem] tabular text-[var(--omc-status-unchanged)]">
          {String(folio).padStart(2, "0")}
        </span>
      )}

      {/* Category chip */}
      <span className="inline-flex items-center rounded-[var(--omc-radius-stamp)] border border-rule bg-surface px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
        {categoryLabel}
      </span>

      {/* Fan variant chip */}
      {fan && (
        <span className="inline-flex items-center rounded-[var(--omc-radius-stamp)] border border-[var(--omc-warning)] px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-warning">
          fan
        </span>
      )}
    </p>
  );
}
