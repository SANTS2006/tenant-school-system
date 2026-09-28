import { Download, FileText } from "lucide-react";

import { triggerFileDownload } from "@/lib/fileDownload";

import { cn } from "@/lib/cn";

/** One uploaded file, shown as a clickable name (opens it in a new tab — the browser's own
 * viewer for an image/PDF counts as "viewing it in app") with a separate Download button next to
 * it that always saves the file instead, regardless of whether the browser would otherwise show
 * it inline. Used everywhere a document/material/attachment is listed. */
export function FileLink({
  url,
  label,
  className,
}: {
  url: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3", className)}>
      <FileText className="size-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
      >
        {label}
      </a>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          triggerFileDownload(url, label);
        }}
        aria-label={`Download ${label}`}
        title="Download"
        className="shrink-0 rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
      >
        <Download className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
