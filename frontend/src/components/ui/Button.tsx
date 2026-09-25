import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-[image:var(--gradient-primary)] text-[var(--color-primary-contrast)]",
    "hover:bg-[image:var(--gradient-primary-hover)]",
    "hover:shadow-[0_10px_30px_-8px_color-mix(in_srgb,var(--color-primary)_65%,transparent)]",
    "focus-visible:outline-[var(--color-primary)]",
  ),
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] hover:border-[var(--color-primary)]/40 focus-visible:outline-[var(--color-primary)]",
  ghost:
    "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)] focus-visible:outline-[var(--color-primary)]",
  danger: cn(
    "bg-[image:var(--gradient-danger)] text-white",
    "hover:bg-[image:var(--gradient-danger-hover)]",
    "hover:shadow-[0_10px_30px_-8px_color-mix(in_srgb,var(--color-danger)_65%,transparent)]",
    "focus-visible:outline-[var(--color-danger)]",
  ),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-all duration-200 ease-out",
          "hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
