import { NavLink } from "react-router-dom";

const linkBase =
  "font-mono text-[0.78rem] uppercase tracking-[0.12em] pb-1 omc-focusable transition-colors duration-150";

export function Masthead({ installedCount }: { installedCount: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--omc-rule)] bg-[var(--omc-bg)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-8 py-3">
        <NavLink to="/" className="omc-focusable group block" aria-label="oh-my-cursor — home">
          <div className="font-mono text-[0.92rem] font-semibold leading-none tracking-tight text-[var(--omc-text)]">
            oh-my-cursor
          </div>
          <div className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[var(--omc-muted)]">
            cursor pack marketplace
          </div>
        </NavLink>

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
                  className="ml-1.5 inline-block rounded-[var(--omc-radius-stamp)] border border-[var(--omc-border)] bg-[var(--omc-surface)] px-1.5 py-0 font-mono text-[0.62rem] tabular-nums text-[var(--omc-muted)]"
                  aria-label={`${installedCount} installed`}
                >
                  {installedCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
