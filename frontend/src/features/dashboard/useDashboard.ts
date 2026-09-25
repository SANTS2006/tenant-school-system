import { useQuery } from "@tanstack/react-query";

import type { ApiError } from "@/lib/api-client";

import { fetchDashboardOverview } from "./api";

export function useDashboardOverview() {
  return useQuery<Awaited<ReturnType<typeof fetchDashboardOverview>>, ApiError>({
    queryKey: ["reports", "dashboard"],
    queryFn: fetchDashboardOverview,
  });
}
