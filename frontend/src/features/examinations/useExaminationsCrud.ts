import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/lib/api-client";

import {
  createExam,
  createExamSchedule,
  createGradeBoundary,
  createGradingScale,
  deleteExam,
  deleteExamSchedule,
  deleteGradeBoundary,
  deleteGradingScale,
  fetchExamSchedules,
  fetchExams,
  fetchGradeBoundaries,
  fetchGradingScales,
  getExam,
  getExamSchedule,
  getGradeBoundary,
  getGradingScale,
  updateExam,
  updateExamSchedule,
  updateGradeBoundary,
  updateGradingScale,
} from "./api";
import type {
  Exam,
  ExamListParams,
  ExamPayload,
  ExamSchedule,
  ExamScheduleListParams,
  ExamSchedulePayload,
  GradeBoundary,
  GradeBoundaryPayload,
  GradingScale,
  GradingScalePayload,
} from "./types";

interface PageParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

const SCALES_KEY = ["examinations", "grading-scales"] as const;
const BOUNDARIES_KEY = ["examinations", "grade-boundaries"] as const;
const EXAMS_KEY = ["examinations", "exams"] as const;
const SCHEDULES_KEY = ["examinations", "schedules"] as const;

export function useGradingScaleList(params: PageParams) {
  return useQuery({
    queryKey: [...SCALES_KEY, "list", params],
    queryFn: () => fetchGradingScales(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useGradingScale(id: string | undefined) {
  return useQuery<GradingScale, ApiError>({
    queryKey: [...SCALES_KEY, "detail", id],
    queryFn: () => getGradingScale(id as string),
    enabled: !!id,
  });
}

export function useCreateGradingScale() {
  const queryClient = useQueryClient();
  return useMutation<GradingScale, ApiError, GradingScalePayload>({
    mutationFn: createGradingScale,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCALES_KEY }),
  });
}

export function useUpdateGradingScale(id: string) {
  const queryClient = useQueryClient();
  return useMutation<GradingScale, ApiError, GradingScalePayload>({
    mutationFn: (values) => updateGradingScale(id, values),
    onSuccess: (scale) => {
      queryClient.invalidateQueries({ queryKey: SCALES_KEY });
      queryClient.setQueryData([...SCALES_KEY, "detail", id], scale);
    },
  });
}

export function useDeleteGradingScale() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: deleteGradingScale,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCALES_KEY }),
  });
}

export function useGradeBoundaryList(params: PageParams & { grading_scale: string }) {
  return useQuery({
    queryKey: [...BOUNDARIES_KEY, "list", params],
    queryFn: () => fetchGradeBoundaries(params),
    enabled: !!params.grading_scale,
    placeholderData: (previousData) => previousData,
  });
}

export function useGradeBoundary(id: string | undefined) {
  return useQuery<GradeBoundary, ApiError>({
    queryKey: [...BOUNDARIES_KEY, "detail", id],
    queryFn: () => getGradeBoundary(id as string),
    enabled: !!id,
  });
}

export function useCreateGradeBoundary() {
  const queryClient = useQueryClient();
  return useMutation<GradeBoundary, ApiError, GradeBoundaryPayload>({
    mutationFn: createGradeBoundary,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOUNDARIES_KEY }),
  });
}

export function useUpdateGradeBoundary(id: string) {
  const queryClient = useQueryClient();
  return useMutation<GradeBoundary, ApiError, GradeBoundaryPayload>({
    mutationFn: (values) => updateGradeBoundary(id, values),
    onSuccess: (boundary) => {
      queryClient.invalidateQueries({ queryKey: BOUNDARIES_KEY });
      queryClient.setQueryData([...BOUNDARIES_KEY, "detail", id], boundary);
    },
  });
}

export function useDeleteGradeBoundary() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: deleteGradeBoundary,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOUNDARIES_KEY }),
  });
}

export function useExamList(params: PageParams & ExamListParams) {
  return useQuery({
    queryKey: [...EXAMS_KEY, "list", params],
    queryFn: () => fetchExams(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useExam(id: string | undefined) {
  return useQuery<Exam, ApiError>({
    queryKey: [...EXAMS_KEY, "detail", id],
    queryFn: () => getExam(id as string),
    enabled: !!id,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation<Exam, ApiError, ExamPayload>({
    mutationFn: createExam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXAMS_KEY }),
  });
}

export function useUpdateExam(id: string) {
  const queryClient = useQueryClient();
  return useMutation<Exam, ApiError, ExamPayload>({
    mutationFn: (values) => updateExam(id, values),
    onSuccess: (exam) => {
      queryClient.invalidateQueries({ queryKey: EXAMS_KEY });
      queryClient.setQueryData([...EXAMS_KEY, "detail", id], exam);
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: deleteExam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXAMS_KEY }),
  });
}

export function useExamScheduleList(params: PageParams & ExamScheduleListParams) {
  return useQuery({
    queryKey: [...SCHEDULES_KEY, "list", params],
    queryFn: () => fetchExamSchedules(params),
    enabled: !!params.exam,
    placeholderData: (previousData) => previousData,
  });
}

export function useExamSchedule(id: string | undefined) {
  return useQuery<ExamSchedule, ApiError>({
    queryKey: [...SCHEDULES_KEY, "detail", id],
    queryFn: () => getExamSchedule(id as string),
    enabled: !!id,
  });
}

export function useCreateExamSchedule() {
  const queryClient = useQueryClient();
  return useMutation<ExamSchedule, ApiError, ExamSchedulePayload>({
    mutationFn: createExamSchedule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY }),
  });
}

export function useUpdateExamSchedule(id: string) {
  const queryClient = useQueryClient();
  return useMutation<ExamSchedule, ApiError, ExamSchedulePayload>({
    mutationFn: (values) => updateExamSchedule(id, values),
    onSuccess: (schedule) => {
      queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });
      queryClient.setQueryData([...SCHEDULES_KEY, "detail", id], schedule);
    },
  });
}

export function useDeleteExamSchedule() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: deleteExamSchedule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY }),
  });
}

/** Every exam schedule across every exam, unfiltered (capped at 100) — for pickers (like Enter
 * Marks) that need to resolve a schedule directly without drilling through one exam at a time. */
export function useAllExamSchedules() {
  return useQuery({
    queryKey: [...SCHEDULES_KEY, "all"],
    queryFn: () => fetchExamSchedules({ page_size: 100 }),
  });
}
