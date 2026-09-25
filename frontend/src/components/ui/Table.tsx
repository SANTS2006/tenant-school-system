import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/cn";

export function TableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
      {...props}
    />
  );
}

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table ref={ref} className={cn("w-full border-collapse text-sm", className)} {...props} />
  ),
);
Table.displayName = "Table";

export const TableHead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("border-b border-[var(--color-border)]", className)} {...props} />
  ),
);
TableHead.displayName = "TableHead";

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={className} {...props} />,
);
TableBody.displayName = "TableBody";

export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b border-[var(--color-border)] last:border-0", className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

export const TableHeaderCell = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]",
        className,
      )}
      {...props}
    />
  ),
);
TableHeaderCell.displayName = "TableHeaderCell";

export const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("px-4 py-3 text-[var(--color-text)]", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

export const TableRowLink = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement> & { onClick?: () => void }
>(({ className, onClick, ...props }, ref) => (
  <tr
    ref={ref}
    onClick={onClick}
    className={cn(
      "border-b border-[var(--color-border)] transition-colors last:border-0",
      onClick && "cursor-pointer hover:bg-[var(--color-bg-subtle)]",
      className,
    )}
    {...props}
  />
));
TableRowLink.displayName = "TableRowLink";
