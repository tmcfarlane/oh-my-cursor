import type { GitPreCommit, Scope, Tool } from "../lib/types";

/**
 * Renders plan.gitPreCommit honestly — never implies the hook is always applied.
 * - null            → a muted "no git hook for this target"
 * - willInstall      → a caution stamp: "<path> · WILL WRITE"
 * - !willInstall     → muted line echoing the literal skip reason
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
        <span aria-hidden="true" className="mr-1.5 text-[var(--omc-rule)]">
          ·
        </span>
        no git hook for this target
      </p>
    );
  }

  const path = gitPreCommit.path || ".git/hooks/pre-commit";

  // The hook WILL be written — caution stamp, the one honest warning here.
  if (gitPreCommit.willInstall) {
    return (
      <div
        className="inline-flex flex-col items-start rounded-[var(--omc-radius-stamp)] border-2 px-2.5 py-1.5"
        style={{ borderColor: "var(--omc-warning)", color: "var(--omc-warning)", transform: "rotate(-1deg)" }}
        role="img"
        aria-label={`Git pre-commit hook ${path} will write on ${scope} scope for ${tools.join(", ") || "selected tools"}`}
      >
        <span className="font-mono text-[0.78rem] font-bold tracking-[0.04em] leading-tight break-all">{path}</span>
        <span className="mt-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.16em] opacity-90">
          Will Write
        </span>
      </div>
    );
  }

  // Skipped — surface the engine's literal reason verbatim, no spin.
  const reason = gitPreCommit.reason ?? "skipped";
  return (
    <p
      className="font-mono text-[0.72rem] text-[var(--omc-muted)] break-words"
      aria-label={`Git hook skipped: ${reason}`}
    >
      <span aria-hidden="true" className="mr-1.5 text-[var(--omc-rule)]">
        ·
      </span>
      git hook skipped <span className="opacity-60">·</span> {reason}
    </p>
  );
}
