import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { buildOmcCommand } from "../lib/cli";
import type { PlanRequest } from "../lib/types";

type Verb = "plan" | "install" | "uninstall";

/**
 * The literal `omc …` command as a printer's running head — a constant reminder
 * that this GUI is a thin wrapper over the real CLI.
 */
export function CliEcho({ request, verb }: { request: PlanRequest; verb: Verb }) {
  const command = buildOmcCommand(request, verb);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="omc-rule flex items-stretch gap-2 bg-sunken">
      <code className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-3 py-2 font-mono text-[0.78rem] leading-none whitespace-nowrap text-ink tabular">
        <span aria-hidden="true" className="select-none text-muted">
          $
        </span>
        <span className="min-w-0">{command}</span>
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy command"
        className="omc-focusable inline-flex shrink-0 items-center gap-1.5 border-l border-rule px-3 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted transition-colors hover:text-accent"
      >
        {copied ? (
          <>
            <Check aria-hidden="true" className="size-3.5" />
            Copied
          </>
        ) : (
          <>
            <Copy aria-hidden="true" className="size-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
