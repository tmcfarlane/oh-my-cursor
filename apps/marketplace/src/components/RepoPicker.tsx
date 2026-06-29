import { useId } from "react";
import { FolderGit2 } from "lucide-react";

interface Props {
  value: string;
  recentRepos: string[];
  required: boolean;
  onChange: (path: string) => void;
}

/**
 * Web-first repository path entry. Plain text field in Space Mono — no native
 * dialog (Tauri will swap in a real folder picker later). Recent repos surface
 * as one-tap buttons. A non-blocking warning shows when a path is required but
 * empty; typing is never gated.
 */
export function RepoPicker({ value, recentRepos, required, onChange }: Props) {
  const inputId = useId();
  const hintId = useId();
  const showHint = required && !value.trim();

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="omc-kicker"
      >
        Repository Path
      </label>

      <div className="flex items-center gap-2">
        <FolderGit2
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-[var(--omc-muted)]"
          strokeWidth={1.75}
        />
        <input
          id={inputId}
          type="text"
          name="repo"
          value={value}
          spellCheck={false}
          autoComplete="off"
          aria-required={required}
          aria-describedby={showHint ? hintId : undefined}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/path/to/your/repo"
          className="omc-focusable min-w-0 flex-1 rounded-[var(--omc-radius)] border border-[var(--omc-border)] bg-[var(--omc-surface)] px-2.5 py-1.5 font-mono text-[0.82rem] text-[var(--omc-text)] placeholder:text-[var(--omc-muted)]"
        />
      </div>

      {showHint && (
        <p
          id={hintId}
          role="alert"
          className="flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-[var(--omc-warning)]"
        >
          <span aria-hidden="true">▲</span>
          Required for Project scope
        </p>
      )}

      {recentRepos.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--omc-muted)]">
            Recent
          </span>
          <ul className="flex flex-wrap gap-1.5">
            {recentRepos.map((repo) => {
              const active = repo === value;
              return (
                <li key={repo}>
                  <button
                    type="button"
                    onClick={() => onChange(repo)}
                    aria-pressed={active}
                    title={repo}
                    className={`omc-focusable max-w-[22ch] truncate rounded-[var(--omc-radius)] border px-2 py-1 font-mono text-[0.72rem] transition-colors ${
                      active
                        ? "border-[var(--omc-text)] bg-[var(--omc-text)] text-[var(--omc-bg)]"
                        : "border-[var(--omc-border)] bg-[var(--omc-surface)] text-[var(--omc-text)] hover:border-[var(--omc-accent-ink)] hover:text-[var(--omc-accent-ink)]"
                    }`}
                  >
                    {repo}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="font-mono text-[0.64rem] leading-snug text-[var(--omc-muted)]">
        Tauri will swap a native folder picker later.
      </p>
    </div>
  );
}
