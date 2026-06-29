import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { CategoryKicker } from "../components/CategoryKicker";
import { TrustStamps } from "../components/TrustStamps";
import { FanImprint } from "../components/FanImprint";
import { useAsync } from "../lib/useAsync";
import { api } from "../lib/api";
import { CATEGORY_LABEL, pluralize } from "../lib/format";
import type { PackSummary } from "../lib/types";

type Category = "team" | "role" | "harness" | "theme";
const CATEGORIES: Category[] = ["team", "role", "harness", "theme"];

interface Filters {
  categories: Set<Category>;
  shellHooks: boolean;
  gitHooks: boolean;
  offlineOnly: boolean;
  verified: boolean;
  community: boolean;
}

const EMPTY_FILTERS: Filters = {
  categories: new Set<Category>(),
  shellHooks: false,
  gitHooks: false,
  offlineOnly: false,
  verified: false,
  community: false,
};

function isFan(pack: PackSummary): boolean {
  return !!pack.theme?.fan;
}

function matches(pack: PackSummary, f: Filters): boolean {
  if (f.categories.size > 0 && !f.categories.has(pack.category)) return false;
  if (f.shellHooks && !pack.permissions.shellHooks) return false;
  if (f.gitHooks && !pack.permissions.gitHooks) return false;
  if (f.offlineOnly && pack.permissions.network) return false;
  // Imprint: treat "both" and "neither" as no constraint.
  if (f.verified !== f.community) {
    const fan = isFan(pack);
    if (f.verified && fan) return false;
    if (f.community && !fan) return false;
  }
  return true;
}

/** A single labelled checkbox row in the contents-rail. */
function FilterCheck({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="omc-focusable h-3.5 w-3.5 shrink-0 accent-[var(--omc-accent)]"
      />
      <span className="font-body text-[0.85rem] text-[var(--omc-text)] group-hover:text-[var(--omc-accent-ink)]">
        {label}
      </span>
      {count != null && (
        <span className="ml-auto font-mono text-[0.66rem] tabular text-[var(--omc-muted)]">{count}</span>
      )}
    </label>
  );
}

/** Left contents-rail: client-side filters across taxonomy, trust surface, and imprint. */
function ContentsRail({
  packs,
  filters,
  setFilters,
}: {
  packs: PackSummary[];
  filters: Filters;
  setFilters: (f: Filters) => void;
}) {
  const counts = useMemo(() => {
    const c: Record<Category, number> = { team: 0, role: 0, harness: 0, theme: 0 };
    for (const p of packs) c[p.category] += 1;
    return c;
  }, [packs]);

  const toggleCategory = (cat: Category, next: boolean) => {
    const categories = new Set(filters.categories);
    if (next) categories.add(cat);
    else categories.delete(cat);
    setFilters({ ...filters, categories });
  };

  return (
    <aside aria-label="Catalog filters" className="lg:sticky lg:top-32 lg:self-start">
      <p className="omc-kicker">Contents</p>

      <fieldset className="mt-4 border-0 p-0">
        <legend className="mb-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-[var(--omc-muted)]">
          Category
        </legend>
        {CATEGORIES.map((cat) => (
          <FilterCheck
            key={cat}
            checked={filters.categories.has(cat)}
            onChange={(next) => toggleCategory(cat, next)}
            label={CATEGORY_LABEL[cat] ?? cat}
            count={counts[cat]}
          />
        ))}
      </fieldset>

      <fieldset className="mt-5 border-0 p-0 omc-rule pt-4">
        <legend className="mb-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-[var(--omc-muted)]">
          Trust surface
        </legend>
        <FilterCheck
          checked={filters.shellHooks}
          onChange={(next) => setFilters({ ...filters, shellHooks: next })}
          label="Ships shell hooks"
        />
        <FilterCheck
          checked={filters.gitHooks}
          onChange={(next) => setFilters({ ...filters, gitHooks: next })}
          label="Ships git hooks"
        />
        <FilterCheck
          checked={filters.offlineOnly}
          onChange={(next) => setFilters({ ...filters, offlineOnly: next })}
          label="Offline only"
        />
      </fieldset>

      <fieldset className="mt-5 border-0 p-0 omc-rule pt-4">
        <legend className="mb-1 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-[var(--omc-muted)]">
          Imprint
        </legend>
        <FilterCheck
          checked={filters.verified}
          onChange={(next) => setFilters({ ...filters, verified: next })}
          label="Verified"
        />
        <FilterCheck
          checked={filters.community}
          onChange={(next) => setFilters({ ...filters, community: next })}
          label="Community / fan"
        />
      </fieldset>
    </aside>
  );
}

/** Editorial tile for a non-cover pack — oversized folio numeral + hairline rule. */
function PackTile({ pack, folio }: { pack: PackSummary; folio: number }) {
  const fan = isFan(pack);
  return (
    <Link
      to={`/pack/${encodeURIComponent(pack.id)}`}
      className="omc-focusable group relative flex flex-col overflow-hidden rounded-[var(--omc-radius)] border border-[var(--omc-border)] bg-[var(--omc-surface)] p-5 shadow-[var(--omc-shadow-1)] transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[var(--omc-shadow-lift)]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-[5rem] font-semibold leading-none text-[var(--omc-rule)] opacity-50 tabular"
      >
        {String(folio).padStart(2, "0")}
      </span>

      <CategoryKicker category={pack.category} folio={folio} fan={fan} />

      <h3 className="mt-2 max-w-[18ch] font-display text-[1.6rem] font-semibold leading-[1.02] tracking-[-0.01em] text-[var(--omc-text)] group-hover:text-[var(--omc-accent-ink)]">
        {pack.name}
      </h3>

      <p className="mt-2 line-clamp-3 max-w-[42ch] font-body text-[0.9rem] leading-snug text-[var(--omc-muted)]">
        {pack.description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4 omc-rule">
        <span className="pt-3 font-mono text-[0.72rem] tabular text-[var(--omc-muted)]">
          {pluralize(pack.skillCount, "skill")} · v{pack.version}
        </span>
        <span className="pt-3 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-[var(--omc-accent-ink)] group-hover:text-[var(--omc-accent)]">
          {fan ? "Community" : "Verified"} →
        </span>
      </div>
    </Link>
  );
}

/** Ghosted placeholder so a sparse registry still reads as a designed spread. */
function ComingTile({ folio }: { folio: number }) {
  return (
    <div
      aria-hidden="true"
      className="relative flex min-h-[12rem] flex-col overflow-hidden rounded-[var(--omc-radius)] border border-dashed border-[var(--omc-rule)] bg-[var(--omc-surface)]/40 p-5"
    >
      <span className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-[5rem] font-semibold leading-none text-[var(--omc-rule)] opacity-25 tabular">
        {String(folio).padStart(2, "0")}
      </span>
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-[var(--omc-muted)] opacity-70">
        No. {String(folio).padStart(2, "0")} · forthcoming
      </p>
      <h3 className="mt-2 font-display text-[1.4rem] font-semibold italic leading-tight text-[var(--omc-muted)] opacity-60">
        Coming edition
      </h3>
      <p className="mt-auto pt-4 font-body text-[0.82rem] text-[var(--omc-muted)] opacity-60">
        A new behavior pack is being typeset.
      </p>
    </div>
  );
}

export default function Collection() {
  const { data, loading, error, reload } = useAsync(() => api.packs(), []);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const reduce = useReducedMotion();

  const allPacks = data?.packs ?? [];
  const visible = useMemo(() => allPacks.filter((p) => matches(p, filters)), [allPacks, filters]);

  // Ghosted forthcoming tiles always trail the (filtered) grid.
  const ghostStart = allPacks.length + 1;
  const ghosts = [0, 1, 2].map((i) => ghostStart + i);

  if (loading) {
    return (
      <p className="font-mono text-[0.85rem] text-[var(--omc-muted)]" role="status">
        Setting the catalog…
      </p>
    );
  }

  if (error) {
    return (
      <div role="alert" className="max-w-prose">
        <p className="omc-kicker">Press failure</p>
        <h1 className="mt-2 font-display text-[2rem] font-semibold leading-tight text-[var(--omc-text)]">
          The catalog wouldn't load
        </h1>
        <p className="mt-3 font-mono text-[0.82rem] text-[var(--omc-danger)]">{error}</p>
        <button
          type="button"
          onClick={reload}
          className="omc-focusable mt-5 inline-flex items-center gap-2 rounded-[var(--omc-radius)] border border-[var(--omc-border)] bg-[var(--omc-surface)] px-4 py-2 font-body text-[0.9rem] font-semibold text-[var(--omc-text)] shadow-[var(--omc-shadow-1)] transition-transform duration-150 ease-out hover:-translate-y-0.5"
        >
          Re-run the press
        </button>
      </div>
    );
  }

  if (allPacks.length === 0) {
    return (
      <div className="max-w-prose">
        <p className="omc-kicker">Empty edition</p>
        <h1 className="mt-2 font-display text-[2rem] font-semibold leading-tight text-[var(--omc-text)]">
          No behavior packs in the registry yet
        </h1>
        <p className="mt-3 font-body text-[0.95rem] text-[var(--omc-muted)]">
          When packs are published they'll appear here as the cover story.
        </p>
      </div>
    );
  }

  const cover = visible[0];
  const rest = visible.slice(1);
  const coverMotion = reduce
    ? {}
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: "easeOut" as const } };

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <ContentsRail packs={allPacks} filters={filters} setFilters={setFilters} />

      <div className="min-w-0">
        {cover ? (
          <motion.article {...coverMotion} className="max-w-3xl" aria-label={`Cover story: ${cover.name}`}>
            <CategoryKicker category={cover.category} folio={1} fan={isFan(cover)} />

            <h1 className="mt-2 font-display font-semibold leading-[0.92] tracking-[-0.02em] text-[var(--omc-text)]" style={{ fontSize: "var(--omc-text-hero)" }}>
              {cover.name}
            </h1>

            <p className="mt-5 max-w-2xl font-display text-[1.3rem] italic leading-snug text-[var(--omc-muted)]">
              {cover.description}
            </p>

            <div className="mt-7 flex flex-wrap items-start gap-x-10 gap-y-6">
              <TrustStamps permissions={cover.permissions} compact />
              <FanImprint fan={isFan(cover)} title={cover.name} showDisclaimer />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link
                to={`/pack/${encodeURIComponent(cover.id)}`}
                className="omc-focusable inline-flex items-center gap-2 rounded-[var(--omc-radius)] bg-[var(--omc-accent)] px-5 py-2.5 font-body text-[0.95rem] font-semibold text-[var(--omc-bg)] shadow-[var(--omc-shadow-1)] transition-transform duration-150 ease-out hover:-translate-y-0.5"
              >
                Read the feature
                <span aria-hidden="true">→</span>
              </Link>
              <span className="font-mono text-[0.8rem] tabular text-[var(--omc-muted)]">
                {pluralize(cover.skillCount, "skill")} · v{cover.version}
              </span>
            </div>
          </motion.article>
        ) : (
          <div className="max-w-prose">
            <p className="omc-kicker">No matches</p>
            <h1 className="mt-2 font-display text-[1.9rem] font-semibold leading-tight text-[var(--omc-text)]">
              Nothing in this edition fits those filters
            </h1>
            <p className="mt-3 font-body text-[0.95rem] text-[var(--omc-muted)]">
              Loosen the contents-rail to bring packs back onto the page.
            </p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="omc-focusable mt-5 inline-flex items-center rounded-[var(--omc-radius)] border border-[var(--omc-border)] bg-[var(--omc-surface)] px-4 py-2 font-body text-[0.9rem] font-semibold text-[var(--omc-text)] transition-transform duration-150 ease-out hover:-translate-y-0.5"
            >
              Clear filters
            </button>
          </div>
        )}

        {(rest.length > 0 || cover) && (
          <>
            <hr className="omc-rule my-10" />
            <h2 className="sr-only">More editions</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {rest.map((p, i) => (
                <PackTile key={p.id} pack={p} folio={i + 2} />
              ))}
              {ghosts.map((folio) => (
                <ComingTile key={folio} folio={folio} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
