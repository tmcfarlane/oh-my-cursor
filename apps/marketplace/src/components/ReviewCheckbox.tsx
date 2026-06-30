import { motion, useReducedMotion } from "motion/react";

interface Props {
  approved: boolean;
  onApprove: () => void;
}

/**
 * Review gate — a dev-native checkbox confirming the user has reviewed the plan.
 * Props: approved, onApprove. Keyboard: Space / Enter to check.
 * Honors prefers-reduced-motion.
 */
export function ReviewCheckbox({ approved, onApprove }: Props) {
  const reduce = useReducedMotion();

  return (
    <div
      role="checkbox"
      aria-checked={approved}
      aria-label="I've reviewed the changes"
      tabIndex={0}
      onClick={() => {
        if (!approved) onApprove();
      }}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !approved) {
          e.preventDefault();
          onApprove();
        }
      }}
      className="omc-focusable group inline-flex cursor-pointer select-none items-center gap-2.5 outline-none"
    >
      {/* Visual checkbox box */}
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border"
        style={{
          borderColor: approved ? "var(--omc-accent)" : "var(--omc-muted)",
          backgroundColor: approved ? "var(--omc-accent)" : "var(--omc-surface-sunken)",
          transition: reduce
            ? "none"
            : "border-color 120ms ease-out, background-color 120ms ease-out",
        }}
      >
        {approved && (
          <motion.svg
            viewBox="0 0 10 8"
            fill="none"
            stroke="var(--omc-surface)"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2.5 w-2.5"
            initial={reduce ? false : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
          >
            <polyline points="1 4 3.5 6.5 9 1" />
          </motion.svg>
        )}
      </span>
      {/* Label */}
      <span className="font-mono text-[0.8125rem] text-[var(--omc-muted)] transition-colors duration-[120ms] group-hover:text-[var(--omc-text)]">
        I've reviewed the changes
      </span>
    </div>
  );
}
