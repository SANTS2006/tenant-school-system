import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-[var(--color-text-muted)]">
      <Loader2 className={cn("size-5 animate-spin", className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
      <Spinner />
    </div>
  );
}
