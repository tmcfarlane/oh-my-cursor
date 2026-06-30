import type { GitPreCommit, Scope, Tool } from "../lib/types";

/**
 * Renders plan.gitPreCommit honestly — never implies the hook is always applied.
 * - null         → muted "no git hook for this target"
 * - willInstall  → flat amber warning line: "<path> · will write"
 * - !willInstall → muted line echoing the literal skip reason
 * No stamp border, no tilt — reads like a terminal status line.
 */
export function GitVerdictStamp({
  gitPreCommit,
  scope,
  tools,
}: {
  gitPreCommit: GitPreCommit | null;
  scope: Scope;
  tools: Tool[];
}) {
  // No git hook is in play for this target at all.
  if (!gitPreCommit) {
    return (
      <p className="font-mono text-[0.72rem] text-[var(--omc-muted)]">
        <span aria-hidden="true" className="mr-1.5 text-[var(--omc-border)]">
          ·
        </span>
        no git hook for this target
      </p>
    );
  }

  const path = gitPreCommit.path || ".git/hooks/pre-commit";

  // The hook WILL be written — flat amber warning line.
  if (gitPreCommit.willInstall) {
    return (
      <p
        className="break-all font-mono text-[0.78rem] text-[var(--omc-warning)]"
        role="status"
        aria-label={`Git pre-commit hook ${path} will write on ${scope} scope for ${tools.join(", ") || "selected tools"}`}
      >
        <span aria-hidden="true" className="mr-1.5 opacity-60">
          !
        </span>
        <span className="font-bold">{path}</span>
        <span aria-hidden="true" className="mx-1.5 opacity-40">
          ·
        </span>
        <span className="text-[0.7rem] uppercase tracking-[0.08em]">will write</span>
      </p>
    );
  }

  // Skipped — surface the engine's literal reason verbatim, no spin.
  const reason = gitPreCommit.reason ?? "skipped";
  return (
    <p
      className="break-words font-mono text-[0.72rem] text-[var(--omc-muted)]"
      aria-label={`Git hook skipped: ${reason}`}
    >
      <span aria-hidden="true" className="mr-1.5 text-[var(--omc-border)]">
        ·
      </span>
      git hook skipped
      <span aria-hidden="true" className="mx-1.5 opacity-40">
        ·
      </span>
      {reason}
    </p>
  );
}
