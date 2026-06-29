import type { PackDetail } from "../lib/types";
import { deriveAgents } from "../lib/agents";
import { AgentPortrait } from "../components/AgentPortrait";

/**
 * Dramatis Personae — the character-roster plate of a pack feature.
 *
 * Printed-catalog framing: a kicker overline, an oversized Fraunces folio numeral
 * counting the players, and a hairline rule. The cast itself is laid out as a
 * responsive grid of letterpress AgentPortrait cells.
 *
 * Degrades gracefully: role/harness packs (and any pack whose skills declare no
 * agents) carry no cast, so we set a single muted "lead" card naming the pack — the
 * plate is never left blank.
 *
 * Not a route screen — imported by PackFeature — but kept a default export so the
 * call site can lazy/dynamic-import it like the rest of the screens.
 */
export default function DramatisPersonae({ pack }: { pack: PackDetail }) {
  const agents = deriveAgents(pack);
  const count = agents.length;

  return (
    <section aria-labelledby="dramatis-personae-heading" className="flex flex-col gap-4">
      <header className="flex items-baseline gap-4">
        <span
          aria-hidden="true"
          className="tabular shrink-0 font-display text-[2.75rem] leading-none text-[var(--omc-muted)]"
        >
          {String(count).padStart(2, "0")}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="omc-kicker tabular">Dramatis Personae</p>
          <h2
            id="dramatis-personae-heading"
            className="font-display text-[1.35rem] leading-tight text-ink"
          >
            {count === 0
              ? "No named cast"
              : `${count} player${count === 1 ? "" : "s"} in this pack`}
          </h2>
        </div>
      </header>

      {count === 0 ? (
        <article className="omc-rule flex flex-col gap-1.5 rounded-[var(--omc-radius)] border border-edge bg-sunken p-4 pt-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--omc-muted)]">
            Lead
          </p>
          <h3 className="font-display text-[1.1rem] leading-tight text-ink">{pack.name}</h3>
          <p className="max-w-prose font-body text-[0.78rem] leading-snug text-[var(--omc-muted)]">
            This pack declares no per-skill cast — it runs as a single lead role rather than a
            multi-agent ensemble.
          </p>
        </article>
      ) : (
        <ul className="omc-rule grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <li key={agent.key}>
              <AgentPortrait agent={agent} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
