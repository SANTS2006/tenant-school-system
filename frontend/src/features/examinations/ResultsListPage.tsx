import { ClipboardCheck, Lock, Pencil, Send, ThumbsUp, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Select } from "@/components/ui/Select";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { StatRow } from "@/components/ui/StatRow";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useHasPermission } from "@/features/auth/useAuth";
import { useSummaryStats } from "@/hooks/useSummaryStats";
import type { ApiError } from "@/lib/api-client";

import { resultStatusLabel, resultStatusTone } from "./resultStatusTone";
import type { Result, ResultStatus } from "./types";
import { useAllExamSchedules } from "./useExaminationsCrud";
import {
  useApproveResult,
  useLockResult,
  usePublishResult,
  useResultList,
  useReviewResult,
  useSubmitResult,
} from "./useResultsCrud";

const STATUS_OPTIONS: ResultStatus[] = ["draft", "submitted", "reviewed", "approved", "published", "locked"];

function ResultActions({ result }: { result: Result }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const canUpdate = useHasPermission("results.update");
  const canApprove = useHasPermission("results.approve");
  const canPublish = useHasPermission("results.publish");
  const canLock = useHasPermission("results.lock");

  const submit = useSubmitResult();
  const review = useReviewResult();
  const approve = useApproveResult();
  const publish = usePublishResult();
  const lock = useLockResult();

  const runTransition = (
    mutation: ReturnType<typeof useSubmitResult>,
    label: string,
  ) => {
    mutation.mutate(result.id, {
      onSuccess: () => showToast({ title: `${label} for ${result.student_name}` }),
      onError: (err: ApiError) => showToast({ title: `Could not ${label.toLowerCase()}`, description: err.message, tone: "danger" }),
    });
  };

  const isPending = submit.isPending || review.isPending || approve.isPending || publish.isPending || lock.isPending;

  return (
    <div className="flex justify-end gap-1">
      {canUpdate && (result.status === "draft" || result.status === "submitted" || result.status === "reviewed") && (
        <button
          type="button"
          onClick={() => navigate(`/examinations/results/${result.id}/edit`)}
          aria-label={`Edit result for ${result.student_name}`}
          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-primary)]"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
      )}
      {canUpdate && result.status === "draft" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => runTransition(submit, "Submitted")}
          aria-label={`Submit result for ${result.student_name}`}
          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-primary)] disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden="true" />
        </button>
      )}
      {canUpdate && result.status === "submitted" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => runTransition(review, "Reviewed")}
          aria-label={`Review result for ${result.student_name}`}
          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-primary)] disabled:opacity-40"
        >
          <ClipboardCheck className="size-4" aria-hidden="true" />
        </button>
      )}
      {canApprove && result.status === "reviewed" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => runTransition(approve, "Approved")}
          aria-label={`Approve result for ${result.student_name}`}
          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-success)] disabled:opacity-40"
        >
          <ThumbsUp className="size-4" aria-hidden="true" />
        </button>
      )}
      {canPublish && result.status === "approved" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => runTransition(publish, "Published")}
          aria-label={`Publish result for ${result.student_name}`}
          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-success)] disabled:opacity-40"
        >
          <Upload className="size-4" aria-hidden="true" />
        </button>
      )}
      {canLock && result.status === "published" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => runTransition(lock, "Locked")}
          aria-label={`Lock result for ${result.student_name}`}
          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-danger)] disabled:opacity-40"
        >
          <Lock className="size-4" aria-hidden="true" />
        </button>
      )}
      {canLock && result.status === "locked" && (
        <button
          type="button"
          onClick={() => navigate(`/examinations/results/${result.id}/correct`)}
          aria-label={`Correct result for ${result.student_name}`}
          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-primary)]"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function ResultsListPage() {
  const [scheduleId, setScheduleId] = useState("");
  const [status, setStatus] = useState<ResultStatus | "">("");
  const { data: schedules } = useAllExamSchedules();

  const filterParams = { exam_schedule: scheduleId || undefined, status: status || undefined };
  const { data, isLoading, isError, error, isFetching } = useResultList({
    page_size: 100,
    ordering: "student__last_name",
    ...filterParams,
  });
  const { data: stats } = useSummaryStats("results", filterParams);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="w-full max-w-xs">
          <Select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)}>
            <option value="">All exam schedules</option>
            {schedules?.results.map((s) => (
              <option key={s.id} value={s.id}>
                {s.exam_name} - {s.school_class_name} - {s.subject_name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full max-w-[180px]">
          <Select value={status} onChange={(e) => setStatus(e.target.value as ResultStatus | "")}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {resultStatusLabel(option)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {stats && (
        <ScrollReveal>
          <StatRow items={[{ key: "total", label: "Total results", value: stats.total as number, icon: ClipboardCheck }]} />
        </ScrollReveal>
      )}

      {isError && <Alert tone="danger">{(error as ApiError).message}</Alert>}

      {isLoading ? (
        <FullPageSpinner />
      ) : data && data.results.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">No results found for these filters.</p>
      ) : data ? (
        <ScrollReveal>
        <TableContainer>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Student</TableHeaderCell>
                <TableHeaderCell>Exam / class / subject</TableHeaderCell>
                <TableHeaderCell>Exam score</TableHeaderCell>
                <TableHeaderCell>CA</TableHeaderCell>
                <TableHeaderCell>Final score</TableHeaderCell>
                <TableHeaderCell>Grade</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {data.results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.student_name}</TableCell>
                  <TableCell>{result.exam_schedule_label}</TableCell>
                  <TableCell>{result.exam_score ?? <span className="text-[var(--color-text-muted)]">—</span>}</TableCell>
                  <TableCell>{result.ca_score ?? <span className="text-[var(--color-text-muted)]">—</span>}</TableCell>
                  <TableCell>{result.score ?? <span className="text-[var(--color-text-muted)]">—</span>}</TableCell>
                  <TableCell>{result.grade || <span className="text-[var(--color-text-muted)]">—</span>}</TableCell>
                  <TableCell>
                    <Badge tone={resultStatusTone(result.status)}>{resultStatusLabel(result.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <ResultActions result={result} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </ScrollReveal>
      ) : null}

      {isFetching && !isLoading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
