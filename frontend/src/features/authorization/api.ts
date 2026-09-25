import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/pagination";

import type { RoleLookup } from "./types";

// A generous page_size — schools have a handful of seeded roles, so one request is enough
// to populate a dropdown; no pagination UI needed here.
const LOOKUP_PAGE_SIZE = { page_size: 100 };

export async function listRoles(): Promise<RoleLookup[]> {
  const { data } = await apiClient.get<PaginatedResponse<RoleLookup>>("/roles/", {
    params: LOOKUP_PAGE_SIZE,
  });
  return data.results;
}
