import type { PackDetail } from "./types";

// Valid Cursor Task slugs (mirrors packages/schema/valid-slugs.json). An unknown slug silently
// downgrades to composer-2.5-fast — the roster flags that so it never hides.
const VALID_SLUGS = new Set([
  "composer-2.5-fast",
  "claude-opus-4-8-thinking-high",
  "gemini-3.1-pro",
  "claude-4.6-opus-high-thinking",
  "claude-4.6-sonnet-medium-thinking",
  "claude-fable-5-thinking-high",
  "gpt-5.3-codex-high-fast",
  "gpt-5.5-medium",
  "kimi-k2.5",
  "inherit",
]);

const ROSTER_ORDER = ["aang", "sokka", "katara", "zuko", "toph", "appa", "momo", "iroh"];

export interface DerivedAgent {
  name: string;
  key: string;
  portrait: string;
  model: string;
  isOverride: boolean;
  invalidSlug: boolean;
  skills: string[];
}

/** Build the dramatis-personae roster: union of skills[].agents, resolved against models. */
export function deriveAgents(pack: PackDetail): DerivedAgent[] {
  const def = pack.models?.default ?? "inherit";
  const overrides = pack.models?.overrides ?? {};
  const names = new Set<string>();
  for (const s of pack.skills ?? []) for (const a of s.agents ?? []) names.add(a);

  const agents: DerivedAgent[] = [...names].map((name) => {
    const key = name.toLowerCase();
    const model = overrides[key] ?? def;
    return {
      name,
      key,
      portrait: `/agents/${key}.png`,
      model,
      isOverride: key in overrides,
      invalidSlug: !VALID_SLUGS.has(model),
      skills: (pack.skills ?? []).filter((s) => (s.agents ?? []).includes(name)).map((s) => s.name),
    };
  });

  return agents.sort((a, b) => {
    const ia = ROSTER_ORDER.indexOf(a.key);
    const ib = ROSTER_ORDER.indexOf(b.key);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.name.localeCompare(b.name);
  });
}
