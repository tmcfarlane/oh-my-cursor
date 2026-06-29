import { CATEGORY_LABEL } from "../lib/format";

interface Props {
  category: "team" | "role" | "harness" | "theme";
  folio?: number;
  fan?: boolean;
}

/** Space Mono small-caps overline with a leading vermillion tick, e.g. "— No. 01 · TEAM · FAN EDITION". */
export function CategoryKicker({ category, folio, fan }: Props) {
  const parts = [
    folio != null ? `No. ${String(folio).padStart(2, "0")}` : null,
    CATEGORY_LABEL[category] ?? category,
    fan ? "Fan Edition" : null,
  ].filter(Boolean);
  return <p className="omc-kicker tabular">{parts.join(" · ")}</p>;
}
