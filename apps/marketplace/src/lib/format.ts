import type { FileStatus } from "./types";

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function pluralize(n: number, word: string, plural = `${word}s`): string {
  return `${n} ${n === 1 ? word : plural}`;
}

/** Proofreader's marks — the four diff statuses as glyph + label (never color alone). */
export const STATUS_MARK: Record<FileStatus, { glyph: string; label: string; cssVar: string }> = {
  new: { glyph: "‸", label: "new", cssVar: "var(--omc-status-new)" },
  update: { glyph: "≈", label: "update", cssVar: "var(--omc-status-update)" },
  unchanged: { glyph: "·", label: "unchanged", cssVar: "var(--omc-status-unchanged)" },
  userModified: { glyph: "⊘", label: "user-modified", cssVar: "var(--omc-status-usermod)" },
};

export const GROUP_LABEL: Record<string, string> = {
  agents: "Agents",
  rules: "Rules",
  commands: "Commands",
  hooks: "Hooks",
  config: "Config",
  skills: "Skills",
};

export const CATEGORY_LABEL: Record<string, string> = {
  team: "Team",
  role: "Role",
  harness: "Harness",
  theme: "Theme",
};
