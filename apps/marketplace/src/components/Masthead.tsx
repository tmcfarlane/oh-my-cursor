import { NavLink } from "react-router-dom";
import { Search } from "lucide-react";

const linkBase =
  "font-mono text-[0.76rem] uppercase tracking-[0.12em] pb-1 omc-focusable transition-colors duration-150";

export function Masthead({
  installedCount,
  onOpenPalette,
}: {
  installedCount: number;
  onOpenPalette?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--omc-rule)] bg-[var(--omc-bg)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-8 py-3">
        <NavLink to="/" className="omc-focusable group flex items-center gap-2.5" aria-label="oh-my-cursor — home">
          {/* Accent terminal mark: a chevron + blinking caret. */}
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-[var(--omc-radius-sm)] border border-[var(--omc-border-strong)] bg-[var(--omc-surface)] font-mono text-[0.78rem] font-semibold text-[var(--omc-accent)] transition-colors group-hover:border-[var(--omc-accent-line)]"
          >
            <span>›</span>
            <span className="omc-caret ml-px">_</span>
          </span>
          <div>
            <div className="font-mono text-[0.92rem] font-semibold leading-none tracking-tight text-[var(--omc-text)]">
              oh-my-cursor
            </div>
            <div className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-[var(--omc-faint)]">
              agent harness marketplace
            </div>
          </div>
        </NavLink>

        <div className="flex items-center gap-5">
          <nav className="flex items-center gap-6" aria-label="Primary">
            {[
              { to: "/", label: "Collection", end: true },
              { to: "/library", label: "Library" },
            ].map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `${linkBase} ${
                    isActive
                      ? "text-[var(--omc-accent)] border-b border-[var(--omc-accent)]"
                      : "text-[var(--omc-muted)] border-b border-transparent hover:text-[var(--omc-text)]"
                  }`
                }
              >
                {l.label}
                {l.label === "Library" && installedCount > 0 && (
                  <span
                    className="ml-1.5 inline-block rounded-[var(--omc-radius-stamp)] border border-[var(--omc-accent-line)] bg-[var(--omc-accent-quiet)] px-1.5 py-0 font-mono text-[0.62rem] tabular-nums text-[var(--omc-accent)]"
                    aria-label={`${installedCount} installed`}
                  >
                    {installedCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {onOpenPalette && (
            <button
              type="button"
              onClick={onOpenPalette}
              aria-label="Open command palette"
              className="omc-focusable group hidden items-center gap-2 rounded-[var(--omc-radius)] border border-[var(--omc-border-strong)] bg-[var(--omc-surface)] py-1.5 pl-2.5 pr-2 text-[var(--omc-muted)] transition-colors hover:border-[var(--omc-accent-line)] hover:text-[var(--omc-text)] sm:flex"
            >
              <Search size={14} strokeWidth={2} aria-hidden="true" />
              <span className="font-body text-[0.78rem]">Search…</span>
              <kbd className="omc-kbd">⌘K</kbd>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
