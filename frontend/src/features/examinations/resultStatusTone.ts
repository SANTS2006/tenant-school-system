import type { BadgeTone } from "@/components/ui/Badge";

import type { ResultStatus } from "./types";

export function resultStatusTone(status: ResultStatus): BadgeTone {
  switch (status) {
    case "draft":
      return "neutral";
    case "submitted":
    case "reviewed":
      return "warning";
    case "approved":
      return "primary";
    case "published":
      return "success";
    case "locked":
      return "danger";
    default:
      return "neutral";
  }
}

export function resultStatusLabel(status: ResultStatus): string {
  return status[0].toUpperCase() + status.slice(1);
}
