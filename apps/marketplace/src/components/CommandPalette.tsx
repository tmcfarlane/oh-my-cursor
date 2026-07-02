import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, LibraryBig, LayoutGrid, CornerDownLeft, FolderCog } from "lucide-react";
import { useAsync } from "../lib/useAsync";
import { api } from "../lib/api";
import { useInstallTarget } from "../app/InstallTargetContext";
import type { PackSummary } from "../lib/types";

/**
 * ⌘K command palette — the keyboard-first spine of the app. Fuzzy-searches the catalog,
 * jumps between screens, and flips the install scope, all without the mouse. Opens on
 * ⌘K / Ctrl-K (wired from AppShell), closes on Esc or scrim click.
 */

interface Cmd {
  id: string;
  section: "Packs" | "Navigate" | "Install target";
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
  keywords?: string;
}

/** Cheap subsequence fuzzy match — every query char appears in order. */
function fuzzy(q: string, text: string): boolean {
  if (!q) return true;
  const s = text.toLowerCase();
  let i = 0;
  for (const ch of q.toLowerCase()) {
    i = s.indexOf(ch, i);
    if (i === -1) return false;
    i += 1;
  }
  return true;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { scope, setScope } = useInstallTarget();
  const packsAsync = useAsync(() => api.packs(), []);
  const packs: PackSummary[] = packsAsync.data?.packs ?? [];

  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (to: string) => {
      onClose();
      navigate(to);
    },
    [navigate, onClose],
  );

  const commands: Cmd[] = useMemo(() => {
    const packCmds: Cmd[] = packs.map((p) => ({
      id: `pack:${p.id}`,
      section: "Packs",
      label: p.name,
      hint: p.category,
      icon: <Package size={15} strokeWidth={2} aria-hidden="true" />,
      keywords: `${p.id} ${p.description} ${(p.tags || []).join(" ")}`,
      run: () => go(`/pack/${encodeURIComponent(p.id)}`),
    }));
    const nav: Cmd[] = [
      {
        id: "nav:collection",
        section: "Navigate",
        label: "Collection",
        hint: "browse packs",
        icon: <LayoutGrid size={15} strokeWidth={2} aria-hidden="true" />,
        run: () => go("/"),
      },
      {
        id: "nav:library",
        section: "Navigate",
        label: "Library",
        hint: "installed packs",
        icon: <LibraryBig size={15} strokeWidth={2} aria-hidden="true" />,
        run: () => go("/library"),
      },
    ];
    const target: Cmd[] = [
      {
        id: "scope:user",
        section: "Install target",
        label: "Scope → user (~/.cursor)",
        hint: scope === "user" ? "active" : undefined,
        icon: <FolderCog size={15} strokeWidth={2} aria-hidden="true" />,
        keywords: "global home scope target",
        run: () => {
          setScope("user");
          onClose();
        },
      },
      {
        id: "scope:project",
        section: "Install target",
        label: "Scope → project (<repo>/.cursor)",
        hint: scope === "project" ? "active" : undefined,
        icon: <FolderCog size={15} strokeWidth={2} aria-hidden="true" />,
        keywords: "repo local scope target",
        run: () => {
          setScope("project");
          onClose();
        },
      },
    ];
    return [...packCmds, ...nav, ...target];
  }, [packs, scope, setScope, go, onClose]);

  const filtered = useMemo(
    () => commands.filter((c) => fuzzy(q, `${c.label} ${c.keywords ?? ""}`)),
    [commands, q],
  );

  // Reset transient state each time the palette opens.
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  // Keep the active row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    }
  };

  // Group filtered results by section while preserving flat index for keyboard nav.
  let flatIdx = -1;
  const sections: Cmd["section"][] = ["Packs", "Navigate", "Install target"];

  return (
    <div
      className="omc-scrim fixed inset-0 z-50 flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onKeyDown}
        className="omc-pop w-full max-w-[620px] overflow-hidden rounded-[var(--omc-radius-lg)] border border-[var(--omc-border-strong)] bg-[var(--omc-surface)] shadow-[var(--omc-shadow-pop)]"
      >
        <div className="flex items-center gap-3 border-b border-[var(--omc-border)] px-4">
          <Search size={17} strokeWidth={2} className="shrink-0 text-[var(--omc-muted)]" aria-hidden="true" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder="Search packs, jump to a screen, switch scope…"
            aria-label="Search commands"
            className="w-full bg-transparent py-3.5 font-body text-[0.95rem] text-[var(--omc-text)] placeholder:text-[var(--omc-faint)] focus:outline-none"
          />
          <kbd className="omc-kbd shrink-0">esc</kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center font-mono text-[0.8rem] text-[var(--omc-muted)]">
              No matches for “{q}”
            </p>
          )}

          {sections.map((section) => {
            const rows = filtered.filter((c) => c.section === section);
            if (rows.length === 0) return null;
            return (
              <div key={section} className="mb-1">
                <p className="px-4 pb-1 pt-2 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[var(--omc-faint)]">
                  {section}
                </p>
                {rows.map((c) => {
                  flatIdx += 1;
                  const idx = flatIdx;
                  const isActive = idx === active;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      data-idx={idx}
                      onMouseMove={() => setActive(idx)}
                      onClick={() => c.run()}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75 ${
                        isActive ? "bg-[var(--omc-accent-quiet)]" : "hover:bg-[var(--omc-surface-2)]"
                      }`}
                    >
                      <span className={isActive ? "text-[var(--omc-accent)]" : "text-[var(--omc-muted)]"}>
                        {c.icon}
                      </span>
                      <span className="flex-1 truncate font-body text-[0.9rem] text-[var(--omc-text)]">
                        {c.label}
                      </span>
                      {c.hint && (
                        <span className="shrink-0 font-mono text-[0.66rem] uppercase tracking-[0.08em] text-[var(--omc-faint)]">
                          {c.hint}
                        </span>
                      )}
                      {isActive && (
                        <CornerDownLeft
                          size={14}
                          strokeWidth={2}
                          className="shrink-0 text-[var(--omc-accent)]"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--omc-border)] px-4 py-2 font-mono text-[0.64rem] text-[var(--omc-faint)]">
          <span className="flex items-center gap-1.5">
            <kbd className="omc-kbd">↑</kbd>
            <kbd className="omc-kbd">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="omc-kbd">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1.5">
            oh-my-cursor
          </span>
        </div>
      </div>
    </div>
  );
}
