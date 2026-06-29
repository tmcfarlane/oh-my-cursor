import { motion, useReducedMotion } from "motion/react";

interface Props {
  approved: boolean;
  onApprove: () => void;
}

/**
 * THE APPROVE-PROOF SEAL — the signature gesture of the press.
 * Un-approved: a ~96px vermillion OUTLINE ring reading "APPROVE / PROOF".
 * On click: stamps down into a FILLED vermillion wax seal that settles at rotate(-4deg),
 * reading "APPROVED". Honors prefers-reduced-motion (instant swap, no animation).
 * Only transform/opacity are animated.
 */
export function WaxSeal({ approved, onApprove }: Props) {
  const reduce = useReducedMotion();

  // Pressed / approved appearance: filled vermillion stamp, settled at -4deg.
  const stamped = {
    backgroundColor: "var(--omc-accent)",
    color: "var(--omc-surface)",
    borderColor: "var(--omc-accent)",
  };
  // Idle / un-approved appearance: vermillion outline ring on paper.
  const outline = {
    backgroundColor: "transparent",
    color: "var(--omc-accent)",
    borderColor: "var(--omc-accent)",
  };

  return (
    <motion.button
      type="button"
      onClick={() => {
        if (!approved) onApprove();
      }}
      disabled={approved}
      aria-pressed={approved}
      aria-label={approved ? "Proof approved" : "Approve proof"}
      className="omc-focusable inline-flex h-24 w-24 select-none flex-col items-center justify-center rounded-full border-2 disabled:cursor-default"
      style={{ boxShadow: "var(--omc-shadow-1)", ...(approved ? stamped : outline) }}
      initial={false}
      animate={{ rotate: approved ? -4 : 0, scale: 1 }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 520, damping: 17, mass: 0.7 }
      }
      whileHover={approved || reduce ? undefined : { y: -2 }}
      whileTap={reduce ? undefined : { scale: 0.9, rotate: -4 }}
    >
      {approved ? (
        <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.16em] leading-none">
          Approved
        </span>
      ) : (
        <span className="flex flex-col items-center font-mono uppercase leading-none">
          <span className="text-[0.66rem] font-bold tracking-[0.18em]">Approve</span>
          <span className="mt-1 text-[0.58rem] tracking-[0.22em] opacity-80">Proof</span>
        </span>
      )}
    </motion.button>
  );
}
