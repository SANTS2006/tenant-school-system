import { type SelectHTMLAttributes, forwardRef, useId } from "react";

import { cn } from "@/lib/cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hintId = `${selectId}-hint`;
    const errorId = `${selectId}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[var(--color-text)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            "h-10 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] transition-colors",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
            "disabled:cursor-not-allowed disabled:opacity-60",
            error ? "border-[var(--color-danger)]" : "border-[var(--color-border)]",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <p id={errorId} className="text-sm text-[var(--color-danger)]">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-sm text-[var(--color-text-muted)]">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = "Select";
