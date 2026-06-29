import type { Tool } from "../lib/types";

interface Props {
  value: Tool[];
  onChange: (tools: Tool[]) => void;
}

interface ChipSpec {
  tool: Tool;
  label: string;
  rotate: number;
}

const CHIPS: ChipSpec[] = [
  { tool: "cursor", label: "Cursor", rotate: -1 },
  { tool: "claude", label: "Claude", rotate: 0.75 },
  { tool: "codex", label: "Codex", rotate: -0.5 },
];

/**
 * Multi-select for mirror targets. cursor is the primary, always-on imprint and
 * cannot be removed; claude and codex are optional. Real checkbox semantics —
 * selection is conveyed by glyph + text, never color alone.
 */
export function ToolsSelect({ value, onChange }: Props) {
  function toggle(tool: Tool, next: boolean) {
    if (tool === "cursor") return; // cursor is mandatory — keep at least cursor selected
    const set = new Set<Tool>(value);
    if (next) set.add(tool);
    else set.delete(tool);
    set.add("cursor"); // guarantee the primary target survives
    // Preserve a stable, canonical order.
    const order: Tool[] = ["cursor", "claude", "codex"];
    onChange(order.filter((t) => set.has(t)));
  }

  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
      <legend className="omc-kicker tabular mb-1">Mirror Targets</legend>

      <ul className="flex flex-wrap items-start gap-3 list-none p-0 m-0">
        {CHIPS.map(({ tool, label, rotate }) => {
          const checked = tool === "cursor" || value.includes(tool);
          const locked = tool === "cursor";
          const color = checked ? "var(--omc-accent)" : "var(--omc-muted)";
          return (
            <li key={tool}>
              <label
                className="omc-focusable group inline-flex cursor-pointer items-center gap-2 rounded-[var(--omc-radius-stamp)] border-2 px-3 py-2 transition-transform duration-150 ease-out hover:-translate-y-[2px]"
                style={{
                  borderColor: color,
                  color: checked ? "var(--omc-accent-ink)" : "var(--omc-text)",
                  transform: `rotate(${rotate}deg)`,
                  boxShadow: checked ? "var(--omc-shadow-1)" : "none",
                  cursor: locked ? "default" : "pointer",
                  opacity: locked && checked ? 1 : undefined,
                }}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  disabled={locked}
                  onChange={(e) => toggle(tool, e.target.checked)}
                />
                <span
                  aria-hidden="true"
                  className="font-mono text-[0.85rem] leading-none"
                  style={{ color }}
                >
                  {checked ? "✓" : "·"}
                </span>
                <span className="font-mono text-[0.82rem] font-bold uppercase tracking-[0.1em] leading-none">
                  {label}
                </span>
                {locked && (
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.14em] text-[var(--omc-muted)] leading-none">
                    Primary
                  </span>
                )}
              </label>
            </li>
          );
        })}
      </ul>

      <p className="font-mono text-[0.7rem] leading-relaxed text-[var(--omc-muted)]">
        agents/rules/commands/hooks mirror to all selected; config → cursor + project only;
        skills → cursor only.
      </p>
    </fieldset>
  );
}
