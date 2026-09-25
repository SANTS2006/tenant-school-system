import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function Pagination({
  page,
  pageSize,
  count,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  count: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-sm text-[var(--color-text-muted)]">
        {count === 0 ? "No results" : `${start}–${end} of ${count}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <span className="text-sm text-[var(--color-text-muted)]">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
