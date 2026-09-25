import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {Icon && <Icon className="size-8 text-[var(--color-text-muted)]" aria-hidden="true" />}
      <p className="text-sm font-medium text-[var(--color-text)]">{title}</p>
      {description && <p className="max-w-sm text-sm text-[var(--color-text-muted)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
