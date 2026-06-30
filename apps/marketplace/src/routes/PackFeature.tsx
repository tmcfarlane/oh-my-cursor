import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { useAsync } from "../lib/useAsync";
import { api } from "../lib/api";
import { GROUP_LABEL, pluralize } from "../lib/format";
import { TrustStamps } from "../components/TrustStamps";
import { FanImprint } from "../components/FanImprint";
import { QuickInstall } from "../components/QuickInstall";
import DramatisPersonae from "./DramatisPersonae";
import type { PackDetail } from "../lib/types";

/** Section overline + hairline rule, shared editorial primitive for this spread. */
function SectionHead({ kicker, title, id }: { kicker: string; title: string; id?: string }) {
  return (
    <header className="mb-4">
      <p className="omc-kicker">{kicker}</p>
      <h2
        id={id}
        className="mt-1 font-display text-[1.5rem] font-semibold leading-tight tracking-[-0.01em] text-[var(--omc-text)]"
      >
        {title}
      </h2>
    </header>
  );
}

/** "Requires Cursor ≥ 3.4" — normalize a semver range echo into a typeset constraint. */
function formatCursorRequirement(raw: string): string {
  const trimmed = raw.trim();
  const pretty = trimmed
    .replace(/^>=\s*/, "≥ ")
    .replace(/^<=\s*/, "≤ ")
    .replace(/^>\s*/, "> ")
    .replace(/^<\s*/, "< ")
    .replace(/^\^\s*/, "≥ ")
    .replace(/^~\s*/, "≈ ");
  return `Requires Cursor ${pretty === trimmed && /^\d/.test(trimmed) ? `≥ ${trimmed}` : pretty}`;
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[var(--omc-muted)]">{label}</dt>
      <dd className="font-mono text-[0.82rem] text-[var(--omc-text)] break-words">{children}</dd>
    </div>
  );
}

function Feature({ pack }: { pack: PackDetail }) {
  const reduce = useReducedMotion();
  const skills = pack.skills ?? [];
  const contents = pack.contents ?? {};
  const contentEntries = Object.entries(contents).filter(([, files]) => Array.isArray(files));
  const requiredPacks = pack.requires?.packs ?? [];

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto max-w-[1100px]"
    >
      <div className="mb-3">
        <Link
          to="/"
          className="omc-focusable font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--omc-accent-ink)] hover:text-[var(--omc-accent)]"
        >
          <span aria-hidden="true">← </span>Back to the Collection
        </Link>
      </div>

      {/* Title block */}
      <h1 className="font-display text-[var(--omc-text-hero)] font-semibold leading-[0.95] tracking-[-0.02em] text-[var(--omc-text)]">
        {pack.name}
      </h1>

      <p className="mt-5 max-w-2xl font-body text-[0.9rem] leading-relaxed text-[var(--omc-muted)]">
        {pack.description}
      </p>

      {pack.requires?.cursor && (
        <p className="mt-5 font-mono text-[0.8rem] text-[var(--omc-text)]">
          {formatCursorRequirement(pack.requires.cursor)}
        </p>
      )}

      {/* Two-column editorial body */}
      <div className="omc-rule mt-8 grid grid-cols-1 gap-x-12 gap-y-10 pt-8 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="flex flex-col gap-12">
          <section aria-labelledby="cast-head">
            <SectionHead kicker="Agents" title="Agent roster" id="cast-head" />
            <div>
              <DramatisPersonae pack={pack} />
            </div>
          </section>

          <section aria-labelledby="skills-head">
            <SectionHead kicker="Skills" title={pluralize(skills.length, "skill")} id="skills-head" />
            {skills.length === 0 ? (
              <p className="font-body text-[0.85rem] text-[var(--omc-muted)]">
                This pack ships no skills.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-x-10 gap-y-2.5 sm:grid-cols-2">
                {skills.map((s) => (
                  <li
                    key={s.name}
                    className="flex flex-col gap-0.5 border-l border-[var(--omc-border)] pl-3"
                  >
                    <span className="font-mono text-[0.82rem] text-[var(--omc-text)]">{s.name}</span>
                    <span className="font-mono text-[0.68rem] text-[var(--omc-muted)] break-words">
                      {s.source}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="manifest-head">
            <SectionHead kicker="Manifest" title={pluralize(contentEntries.length, "content group")} id="manifest-head" />
            {contentEntries.length === 0 ? (
              <p className="font-body text-[0.85rem] text-[var(--omc-muted)]">
                No contents declared in this manifest.
              </p>
            ) : (
              <>
                <dl className="flex flex-col gap-2">
                  {contentEntries.map(([group, files]) => (
                    <div
                      key={group}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--omc-rule)] py-1.5"
                    >
                      <dt className="min-w-24 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--omc-muted)]">
                        {GROUP_LABEL[group] ?? group}
                      </dt>
                      <dd className="font-mono text-[0.78rem] text-[var(--omc-text)] break-words">
                        {files.join("  ·  ")}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2 font-mono text-[0.66rem] text-[var(--omc-muted)]">
                  Declared globs — exact file counts appear in the dry-run plan.
                </p>
              </>
            )}
          </section>
        </div>

        {/* Right rail — provenance, trust, CTA */}
        <aside className="flex flex-col gap-8 lg:border-l lg:border-[var(--omc-rule)] lg:pl-10">
          <dl className="flex flex-col gap-3">
            <MetaRow label="Version">
              <span className="tabular">v{pack.version}</span>
            </MetaRow>
            {pack.author && <MetaRow label="Author">{pack.author}</MetaRow>}
            {pack.license && <MetaRow label="License">{pack.license}</MetaRow>}
            {pack.homepage && (
              <MetaRow label="Homepage">
                <a
                  href={pack.homepage}
                  target="_blank"
                  rel="noreferrer"
                  className="omc-focusable text-[var(--omc-accent-ink)] underline decoration-[var(--omc-rule)] underline-offset-2 hover:text-[var(--omc-accent)]"
                >
                  {pack.homepage.replace(/^https?:\/\//, "")}
                </a>
              </MetaRow>
            )}
            {requiredPacks.length > 0 && (
              <MetaRow label="Requires packs">{requiredPacks.join(", ")}</MetaRow>
            )}
          </dl>

          <section aria-label="Trust surface">
            <p className="omc-kicker mb-3">Trust Surface</p>
            <TrustStamps permissions={pack.permissions} />
          </section>

          <FanImprint fan={!!pack.theme?.fan} title={pack.theme?.title ?? pack.name} showDisclaimer />

          <QuickInstall packId={pack.id} />
        </aside>
      </div>
    </motion.article>
  );
}

export default function PackFeature() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useAsync(
    () => api.pack(id ?? ""),
    [id],
  );

  if (loading) {
    return (
      <p className="font-mono text-[0.85rem] text-[var(--omc-muted)]">Loading…</p>
    );
  }

  if (error) {
    return (
      <div role="alert" className="max-w-prose">
        <p className="omc-kicker">Load error</p>
        <h1 className="mt-1 font-display text-[2rem] font-semibold text-[var(--omc-text)]">
          This pack could not be loaded
        </h1>
        <p className="mt-3 font-mono text-[0.82rem] text-[var(--omc-danger)]">{error}</p>
        <Link
          to="/"
          className="omc-focusable mt-5 inline-block font-mono text-[0.74rem] uppercase tracking-[0.14em] text-[var(--omc-accent-ink)] hover:text-[var(--omc-accent)]"
        >
          <span aria-hidden="true">← </span>Back to the Collection
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="font-mono text-[0.85rem] text-[var(--omc-muted)]">No pack found.</p>
    );
  }

  return <Feature pack={data} />;
}
