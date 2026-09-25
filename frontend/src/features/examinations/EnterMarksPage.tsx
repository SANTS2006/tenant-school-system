import { useQuery } from "@tanstack/react-query";
import { ClipboardList, User } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FullPageSpinner } from "@/components/ui/Spinner";
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
import { listStudents } from "@/features/students/api";
import type { Student } from "@/features/students/types";
import type { ApiError } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/pagination";

import { resultStatusLabel, resultStatusTone } from "./resultStatusTone";
import type { BulkEnterResponse, Result } from "./types";
import { useExamList, useExamScheduleList } from "./useExaminationsCrud";
import { useBulkEnterResults, useResultList } from "./useResultsCrud";

interface EntryState {
  exam_score: string;
  teacher_comment: string;
}

function initialEntries(roster: PaginatedResponse<Student>, existing: Result[]): Record<string, EntryState> {
  const existingByStudent = new Map(existing.map((result) => [result.student, result]));
  const entries: Record<string, EntryState> = {};
  for (const student of roster.results) {
    const result = existingByStudent.get(student.id);
    entries[student.id] =
      result && result.status === "draft"
        ? { exam_score: result.exam_score ?? "", teacher_comment: result.teacher_comment }
        : { exam_score: "", teacher_comment: "" };
  }
  return entries;
}

/** Keyed by the schedule it was initialized for, so switching the exam schedule remounts this
 * with freshly-derived state instead of syncing local state from fetched data via an effect —
 * the same pattern `RosterEditor` in `attendance/TakeAttendancePage.tsx` uses, for the same
 * reason (avoids a `set-state-in-effect` cascading-render risk). */
function MarksEditor({
  scheduleId,
  maxScore,
  roster,
  existing,
  canCreate,
}: {
  scheduleId: string;
  maxScore: number;
  roster: PaginatedResponse<Student>;
  existing: Result[];
  canCreate: boolean;
}) {
  const { showToast } = useToast();
  const bulkEnter = useBulkEnterResults();
  const [entries, setEntries] = useState<Record<string, EntryState>>(() => initialEntries(roster, existing));
  const [skipped, setSkipped] = useState<BulkEnterResponse["skipped"]>([]);

  const existingByStudent = new Map(existing.map((result) => [result.student, result]));

  const setEntry = (studentId: string, patch: Partial<EntryState>) => {
    setEntries((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  };

  const handleSubmit = () => {
    bulkEnter.mutate(
      {
        exam_schedule: scheduleId,
        entries: roster.results.map((student) => ({
          student_id: student.id,
          exam_score: entries[student.id]?.exam_score || undefined,
          teacher_comment: entries[student.id]?.teacher_comment || undefined,
        })),
      },
      {
        onSuccess: (response) => {
          setSkipped(response.skipped);
          showToast({ title: response.message });
        },
        onError: (err: ApiError) => showToast({ title: "Could not save marks", description: err.message, tone: "danger" }),
      },
    );
  };

  return (
    <>
      {bulkEnter.isError && <Alert tone="danger">{(bulkEnter.error as ApiError).message}</Alert>}

      {skipped.length > 0 && (
        <Alert tone="warning">
          {skipped.length} student{skipped.length === 1 ? "" : "s"} already {skipped.length === 1 ? "has" : "have"} a
          non-draft result and {skipped.length === 1 ? "was" : "were"} left unchanged — edit those individually from
          the Results tab instead.
        </Alert>
      )}

      <p className="text-sm text-[var(--color-text-muted)]">
        Max score for this schedule is <strong>{maxScore}</strong>. Enter the exam-portion score only — CA is added
        automatically from graded assignments. Scores aren't capped automatically — double-check before saving.
      </p>

      <TableContainer>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Student</TableHeaderCell>
              <TableHeaderCell>Admission #</TableHeaderCell>
              <TableHeaderCell>Exam score</TableHeaderCell>
              <TableHeaderCell>CA (auto)</TableHeaderCell>
              <TableHeaderCell>Final</TableHeaderCell>
              <TableHeaderCell>Comment</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {roster.results.map((student) => {
              const result = existingByStudent.get(student.id);
              const isLocked = !!result && result.status !== "draft";
              return (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
                        {student.photo ? (
                          <img src={student.photo} alt="" className="size-full object-cover" />
                        ) : (
                          <User className="size-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                        )}
                      </span>
                      {student.full_name}
                    </div>
                  </TableCell>
                  <TableCell>{student.admission_number}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      disabled={!canCreate || isLocked}
                      value={entries[student.id]?.exam_score ?? ""}
                      onChange={(e) => setEntry(student.id, { exam_score: e.target.value })}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>{result?.ca_score ?? <span className="text-[var(--color-text-muted)]">—</span>}</TableCell>
                  <TableCell>{result?.score ?? <span className="text-[var(--color-text-muted)]">—</span>}</TableCell>
                  <TableCell>
                    <Input
                      placeholder="Comment (optional)"
                      disabled={!canCreate || isLocked}
                      value={entries[student.id]?.teacher_comment ?? ""}
                      onChange={(e) => setEntry(student.id, { teacher_comment: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    {result ? (
                      <Badge tone={resultStatusTone(result.status)}>{resultStatusLabel(result.status)}</Badge>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">Not entered</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} isLoading={bulkEnter.isPending}>
            Save marks
          </Button>
        </div>
      )}
    </>
  );
}

export function EnterMarksPage() {
  const canCreate = useHasPermission("results.create");

  const [examId, setExamId] = useState("");
  const [scheduleId, setScheduleId] = useState("");

  const { data: exams } = useExamList({ page_size: 100 });
  const { data: schedules } = useExamScheduleList({ exam: examId, page_size: 100 });
  const schedule = schedules?.results.find((s) => s.id === scheduleId);

  const {
    data: roster,
    isLoading: isLoadingRoster,
    isError: isRosterError,
    error: rosterError,
  } = useQuery<PaginatedResponse<Student>, ApiError>({
    queryKey: ["students", "roster-for-exam", schedule?.school_class],
    queryFn: () =>
      listStudents({ current_class: schedule?.school_class, status: "active", page_size: 100, ordering: "last_name" }),
    enabled: !!schedule,
  });

  const { data: existingResults, isLoading: isLoadingExisting } = useResultList(
    { exam_schedule: scheduleId, page_size: 100 },
    { enabled: !!scheduleId },
  );

  const isLoadingData = isLoadingRoster || isLoadingExisting;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="w-full max-w-xs">
          <Select
            label="Exam"
            value={examId}
            onChange={(e) => {
              setExamId(e.target.value);
              setScheduleId("");
            }}
          >
            <option value="">Choose an exam</option>
            {exams?.results.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} ({exam.term_name})
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full max-w-xs">
          <Select label="Class / subject" value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} disabled={!examId}>
            <option value="">Choose a schedule</option>
            {schedules?.results.map((s) => (
              <option key={s.id} value={s.id}>
                {s.school_class_name} - {s.subject_name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isRosterError && <Alert tone="danger">{(rosterError as ApiError).message}</Alert>}

      {!scheduleId ? (
        <EmptyState
          icon={ClipboardList}
          title="Pick an exam and a class/subject"
          description="Choose a schedule above to load that class's roster and enter marks."
        />
      ) : isLoadingData ? (
        <FullPageSpinner />
      ) : !roster || roster.results.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No active students in this class" />
      ) : (
        <MarksEditor
          key={scheduleId}
          scheduleId={scheduleId}
          maxScore={schedule ? Number(schedule.max_score) : 100}
          roster={roster}
          existing={existingResults?.results ?? []}
          canCreate={canCreate}
        />
      )}
    </div>
  );
}
