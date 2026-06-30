import type { Tool } from "../lib/types";

interface Props {
  value: Tool[];
  onChange: (tools: Tool[]) => void;
}

interface ChipSpec {
  tool: Tool;
  label: string;
}

const CHIPS: ChipSpec[] = [
  { tool: "cursor", label: "Cursor" },
  { tool: "claude", label: "Claude" },
  { tool: "codex", label: "Codex" },
];

/**
 * Multi-select for mirror targets. All targets are toggleable, with a floor of
 * one: the last selected target can't be removed (an empty plan installs nothing).
 * Cursor is selected by default; deselecting it drops the cursor-only skills,
 * config, and git hook. Real checkbox semantics — selection is conveyed by glyph
 * + text, never color alone.
 */
export function ToolsSelect({ value, onChange }: Props) {
  function toggle(tool: Tool, next: boolean) {
    const set = new Set<Tool>(value);
    if (next) set.add(tool);
    else {
      if (set.size <= 1) return; // keep at least one target selected
      set.delete(tool);
    }
    // Preserve a stable, canonical order.
    const order: Tool[] = ["cursor", "claude", "codex"];
    onChange(order.filter((t) => set.has(t)));
  }

  return (
    <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
      <legend className="omc-kicker tabular mb-1">Mirror Targets</legend>

      <ul className="flex flex-wrap items-start gap-2 list-none p-0 m-0">
        {CHIPS.map(({ tool, label }) => {
          const checked = value.includes(tool);
          const isLast = checked && value.length === 1; // can't deselect the last target
          return (
            <li key={tool}>
              <label
                title={isLast ? "At least one target must stay selected" : undefined}
                className={`omc-focusable group inline-flex items-center gap-2 rounded-[var(--omc-radius-stamp)] border px-3 py-1.5 transition-colors duration-150 ease-out ${
                  isLast ? "cursor-default" : "cursor-pointer"
                } ${
                  checked
                    ? "border-[var(--omc-accent)] bg-[var(--omc-surface)]"
                    : "border-[var(--omc-border)] bg-[var(--omc-surface)] hover:border-[var(--omc-accent-ink)]"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  disabled={isLast}
                  onChange={(e) => toggle(tool, e.target.checked)}
                />
                <span
                  aria-hidden="true"
                  className="font-mono text-[0.85rem] leading-none"
                  style={{ color: checked ? "var(--omc-accent)" : "var(--omc-muted)" }}
                >
                  {checked ? "✓" : "·"}
                </span>
                <span
                  className="font-mono text-[0.82rem] font-bold uppercase tracking-[0.1em] leading-none"
                  style={{ color: checked ? "var(--omc-text)" : "var(--omc-muted)" }}
                >
                  {label}
                </span>
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
