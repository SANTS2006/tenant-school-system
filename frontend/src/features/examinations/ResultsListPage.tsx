import { ClipboardCheck } from "lucide-react";
import { useState } from "react";

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
import { useResultList, useSetResultStatus } from "./useResultsCrud";

const STATUS_OPTIONS: ResultStatus[] = ["draft", "submitted", "reviewed", "approved", "published", "locked"];

function ResultStatusCell({ result }: { result: Result }) {
  const { showToast } = useToast();
  const canChange = useHasPermission("results.lock");
  const setStatus = useSetResultStatus();

  if (!canChange) {
    return <Badge tone={resultStatusTone(result.status)}>{resultStatusLabel(result.status)}</Badge>;
  }
  return (
    <Select
      aria-label={`Status for ${result.student_name}`}
      value={result.status}
      disabled={setStatus.isPending}
      onChange={(e) =>
        setStatus.mutate(
          { id: result.id, status: e.target.value as ResultStatus },
          {
            onSuccess: () => showToast({ title: `Status updated for ${result.student_name}` }),
            onError: (err: ApiError) =>
              showToast({ title: "Could not update status", description: err.message, tone: "danger" }),
          },
        )
      }
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {resultStatusLabel(option)}
        </option>
      ))}
    </Select>
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
                  <TableCell className="min-w-[150px]">
                    <ResultStatusCell result={result} />
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
