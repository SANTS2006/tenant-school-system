import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/lib/api-client";

import { createStaff, fetchStaff, getStaff, reactivateStaff, resetStaffPassword, terminateStaff, updateStaff } from "./api";
import type { Staff, StaffListParams, StaffPayload } from "./types";

const STAFF_KEY = ["staff", "records"] as const;

export function useStaffList(params: StaffListParams) {
  return useQuery({
    queryKey: [...STAFF_KEY, "list", params],
    queryFn: () => fetchStaff(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useStaffMember(id: string | undefined) {
  return useQuery<Staff, ApiError>({
    queryKey: [...STAFF_KEY, "detail", id],
    queryFn: () => getStaff(id as string),
    enabled: !!id,
  });
}

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation<Staff, ApiError, StaffPayload>({
    mutationFn: createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useUpdateStaff(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Staff, ApiError, StaffPayload>({
    mutationFn: (values) => updateStaff(id, values),
    onSuccess: (staff) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.setQueryData([...STAFF_KEY, "detail", id], staff);
    },
  });
}

export function useTerminateStaff() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: terminateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useReactivateStaff() {
  const queryClient = useQueryClient();
  return useMutation<Staff, ApiError, string>({
    mutationFn: reactivateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useResetStaffPassword() {
  return useMutation<string, ApiError, string>({
    mutationFn: resetStaffPassword,
  });
}
