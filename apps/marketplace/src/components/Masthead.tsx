import { NavLink } from "react-router-dom";

const linkBase = "font-mono text-[0.78rem] uppercase tracking-[0.12em] pb-1 omc-focusable";

export function Masthead({ installedCount }: { installedCount: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--omc-rule)] bg-[var(--omc-bg)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] items-end justify-between gap-6 px-8 py-3">
        <NavLink to="/" className="omc-focusable group block" aria-label="The Behavior Catalog — home">
          <div className="font-display text-[1.35rem] font-semibold leading-none tracking-[-0.01em] text-[var(--omc-text)]">
            The Behavior Catalog
          </div>
          <div className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--omc-muted)]">
            oh-my-cursor · install a coding harness
          </div>
        </NavLink>

        <nav className="flex items-center gap-7" aria-label="Primary">
          {[
            { to: "/", label: "Collection", end: true },
            { to: "/library", label: "Library" },
          ].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? "text-[var(--omc-accent)] border-b-2 border-[var(--omc-accent)]" : "text-[var(--omc-text)] border-b-2 border-transparent hover:text-[var(--omc-accent-ink)]"}`
              }
            >
              {l.label}
              {l.label === "Library" && installedCount > 0 && (
                <span className="ml-1.5 font-display text-[var(--omc-accent)]" aria-label={`${installedCount} installed`}>
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
