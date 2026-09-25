import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/cn";

import { CampusIllustration } from "./CampusIllustration";

/** Right-hand promotional panel. Full on md+; on phones it collapses to a compact banner
 * (paragraph hidden) so the form is reachable immediately. */
export function BrandPanel({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <aside
      aria-label="About NTS School System"
      className={cn(
        "relative isolate flex min-h-[170px] items-center justify-center overflow-hidden text-white md:min-h-full",
        className,
      )}
    >
      <motion.div
        initial={{ scale: reduce ? 1 : 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: "easeOut" }}
        className="absolute inset-0 -z-20"
      >
        <CampusIllustration className="size-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,rgba(7,28,72,0.72)_0%,rgba(10,42,107,0.55)_50%,rgba(14,116,144,0.45)_100%)]" />

      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="flex max-w-xs flex-col items-center px-8 py-8 text-center md:py-12"
      >
        <span className="mb-4 flex h-14 items-center rounded-2xl bg-white px-4 shadow-lg shadow-black/20 md:h-16">
          <img src="/nts-logo.webp" alt="NTS" className="h-8 w-auto md:h-10" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">NTS School System</p>
        <h2 className="mt-3 text-lg drop-shadow-[0_1px_6px_rgba(7,28,72,0.8)] font-semibold leading-snug md:text-2xl">
          Empowering schools with smarter management and better learning.
        </h2>
        <p className="mt-3 hidden text-sm leading-relaxed text-blue-100 md:block">
          Manage students, teachers, results, classes, attendance and school operations from one connected platform.
        </p>
      </motion.div>
    </aside>
  );
}
