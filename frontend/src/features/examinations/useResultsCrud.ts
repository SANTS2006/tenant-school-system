import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/lib/api-client";

import {
  approveResult,
  bulkEnterResults,
  correctResult,
  createResult,
  fetchMyTranscript,
  fetchReportCard,
  fetchResults,
  getResult,
  lockResult,
  publishResult,
  reviewResult,
  submitResult,
  updateResult,
} from "./api";
import type {
  BulkEnterPayload,
  BulkEnterResponse,
  CorrectResultPayload,
  ReportCard,
  Result,
  ResultEditPayload,
  ResultListParams,
  ResultPayload,
  Transcript,
} from "./types";

interface PageParams {
  page?: number;
  page_size?: number;
  ordering?: string;
}

const RESULTS_KEY = ["examinations", "results"] as const;

export function useResultList(params: PageParams & ResultListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...RESULTS_KEY, "list", params],
    queryFn: () => fetchResults(params),
    enabled: options?.enabled,
    placeholderData: (previousData) => previousData,
  });
}

export function useResult(id: string | undefined) {
  return useQuery<Result, ApiError>({
    queryKey: [...RESULTS_KEY, "detail", id],
    queryFn: () => getResult(id as string),
    enabled: !!id,
  });
}

export function useCreateResult() {
  const queryClient = useQueryClient();
  return useMutation<Result, ApiError, ResultPayload>({
    mutationFn: createResult,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESULTS_KEY }),
  });
}

export function useUpdateResult(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Result, ApiError, ResultEditPayload>({
    mutationFn: (values) => updateResult(id, values),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: RESULTS_KEY });
      queryClient.setQueryData([...RESULTS_KEY, "detail", id], result);
    },
  });
}

function useTransition(mutationFn: (id: string) => Promise<Result>) {
  const queryClient = useQueryClient();
  return useMutation<Result, ApiError, string>({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESULTS_KEY }),
  });
}

export const useSubmitResult = () => useTransition(submitResult);
export const useReviewResult = () => useTransition(reviewResult);
export const useApproveResult = () => useTransition(approveResult);
export const usePublishResult = () => useTransition(publishResult);
export const useLockResult = () => useTransition(lockResult);

export function useCorrectResult(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Result, ApiError, CorrectResultPayload>({
    mutationFn: (values) => correctResult(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESULTS_KEY }),
  });
}

export function useBulkEnterResults() {
  const queryClient = useQueryClient();
  return useMutation<BulkEnterResponse, ApiError, BulkEnterPayload>({
    mutationFn: bulkEnterResults,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESULTS_KEY }),
  });
}

export function useReportCard(params: { student: string; term?: string }) {
  return useQuery<ReportCard, ApiError>({
    queryKey: [...RESULTS_KEY, "report-card", params],
    queryFn: () => fetchReportCard(params),
    enabled: !!params.student,
  });
}

export function useMyTranscript() {
  return useQuery<Transcript, ApiError>({
    queryKey: [...RESULTS_KEY, "transcript", "me"],
    queryFn: fetchMyTranscript,
  });
}
