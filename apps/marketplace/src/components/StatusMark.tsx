import { STATUS_MARK } from "../lib/format";
import type { FileStatus } from "../lib/types";

/** A diff-status glyph for one change type. Distinguishable by glyph + text, never color alone. */
export function StatusMark({ status, showLabel = false }: { status: FileStatus; showLabel?: boolean }) {
  const m = STATUS_MARK[status];
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: m.cssVar }}>
      <span aria-hidden="true" className="font-mono text-[1rem] leading-none">
        {m.glyph}
      </span>
      <span className={showLabel ? "font-mono text-[0.65rem] uppercase tracking-[0.1em]" : "sr-only"}>{m.label}</span>
    </span>
  );
}
