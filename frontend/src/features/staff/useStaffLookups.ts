import { useQuery } from "@tanstack/react-query";

import { listStaff } from "./api";

export function useStaffLookup() {
  return useQuery({ queryKey: ["staff", "lookup"], queryFn: listStaff });
}
