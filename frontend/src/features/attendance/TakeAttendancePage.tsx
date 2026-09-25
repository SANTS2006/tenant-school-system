import { useQuery } from "@tanstack/react-query";
import { CheckCheck, User, Users } from "lucide-react";
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
import { useSubjectList } from "@/features/academics/useAcademicsCrud";
import { useAllSections } from "@/features/academics/useAcademicsLookups";
import { useHasPermission } from "@/features/auth/useAuth";
import { listStudents } from "@/features/students/api";
import type { Student } from "@/features/students/types";
import { usePeriodList } from "@/features/timetable/useTimetableCrud";
import type { ApiError } from "@/lib/api-client";
import type { PaginatedResponse } from "@/types/pagination";

import { fetchStudentAttendance } from "./api";
import { attendanceStatusLabel } from "./statusTone";
import type { AttendanceStatus, StudentAttendance } from "./types";
import { useBulkMarkAttendance } from "./useAttendanceCrud";

const STATUS_OPTIONS: AttendanceStatus[] = ["present", "absent", "late", "excused", "early_departure"];

interface RosterEntry {
  status: AttendanceStatus;
  notes: string;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialEntries(
  roster: PaginatedResponse<Student>,
  existing: PaginatedResponse<StudentAttendance> | undefined,
  periodId: string,
): Record<string, RosterEntry> {
  const existingByStudent = new Map(
    (existing?.results ?? []).filter((record) => (record.period ?? "") === periodId).map((record) => [record.student, record]),
  );
  const entries: Record<string, RosterEntry> = {};
  for (const student of roster.results) {
    const record = existingByStudent.get(student.id);
    entries[student.id] = { status: record?.status ?? "present", notes: record?.notes ?? "" };
  }
  return entries;
}

/** Keyed by the scope (section/date/subject/period) it was initialized for, so switching that
 * scope remounts this component with freshly-derived state instead of needing an effect to
 * re-sync local state from newly-fetched data. */
function RosterEditor({
  roster,
  existing,
  periodId,
  date,
  sectionId,
  subjectId,
  canCreate,
}: {
  roster: PaginatedResponse<Student>;
  existing: PaginatedResponse<StudentAttendance> | undefined;
  periodId: string;
  date: string;
  sectionId: string;
  subjectId: string;
  canCreate: boolean;
}) {
  const { showToast } = useToast();
  const bulkMark = useBulkMarkAttendance();
  const [entries, setEntries] = useState<Record<string, RosterEntry>>(() => initialEntries(roster, existing, periodId));

  const summary = STATUS_OPTIONS.reduce(
    (acc, status) => {
      acc[status] = Object.values(entries).filter((entry) => entry.status === status).length;
      return acc;
    },
    {} as Record<AttendanceStatus, number>,
  );

  const setEntry = (studentId: string, patch: Partial<RosterEntry>) => {
    setEntries((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  };

  const markAllPresent = () => {
    setEntries((prev) => {
      const next = { ...prev };
      for (const studentId of Object.keys(next)) {
        next[studentId] = { ...next[studentId], status: "present" };
      }
      return next;
    });
  };

  const handleSubmit = () => {
    bulkMark.mutate(
      {
        date,
        section: sectionId,
        subject: subjectId || undefined,
        period: periodId || undefined,
        entries: roster.results.map((student) => ({
          student_id: student.id,
          status: entries[student.id]?.status ?? "present",
          notes: entries[student.id]?.notes || undefined,
        })),
      },
      {
        onSuccess: (results) => showToast({ title: `Marked attendance for ${results.length} student(s).` }),
        onError: (err: ApiError) => showToast({ title: "Could not save attendance", description: err.message, tone: "danger" }),
      },
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((status) => (
            <Badge key={status} tone="neutral">
              {attendanceStatusLabel(status)}: {summary[status]}
            </Badge>
          ))}
        </div>
        {canCreate && (
          <Button variant="secondary" size="sm" onClick={markAllPresent}>
            <CheckCheck className="size-4" aria-hidden="true" />
            Mark all present
          </Button>
        )}
      </div>

      {bulkMark.isError && <Alert tone="danger">{(bulkMark.error as ApiError).message}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Student</TableHeaderCell>
              <TableHeaderCell>Admission #</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Notes</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {roster.results.map((student) => (
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
                  <Select
                    value={entries[student.id]?.status ?? "present"}
                    disabled={!canCreate}
                    onChange={(e) => setEntry(student.id, { status: e.target.value as AttendanceStatus })}
                    className="min-w-[160px]"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {attendanceStatusLabel(status)}
                      </option>
                    ))}
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Notes (optional)"
                    disabled={!canCreate}
                    value={entries[student.id]?.notes ?? ""}
                    onChange={(e) => setEntry(student.id, { notes: e.target.value })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {canCreate && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} isLoading={bulkMark.isPending}>
            Save attendance
          </Button>
        </div>
      )}
    </>
  );
}

export function TakeAttendancePage() {
  const canCreate = useHasPermission("attendance.create");

  const [date, setDate] = useState(todayIsoDate);
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [periodId, setPeriodId] = useState("");

  const { data: sections } = useAllSections();
  const { data: subjects } = useSubjectList({ page_size: 100 });
  const { data: periods } = usePeriodList({ page_size: 100, ordering: "order" });

  const {
    data: roster,
    isLoading: isLoadingRoster,
    isError: isRosterError,
    error: rosterError,
  } = useQuery<Awaited<ReturnType<typeof listStudents>>, ApiError>({
    queryKey: ["students", "roster", sectionId],
    queryFn: () => listStudents({ current_section: sectionId, status: "active", page_size: 100, ordering: "last_name" }),
    enabled: !!sectionId,
  });

  // The backend can't filter attendance by `period` server-side (it's not in that endpoint's
  // filterset), so this fetches every record for the date/section/subject and matches the exact
  // period client-side in `initialEntries` — correct either way, since a school with few
  // sections has few records per day regardless.
  const { data: existing, isLoading: isLoadingExisting } = useQuery({
    queryKey: ["attendance", "students", "existing", sectionId, date, subjectId],
    queryFn: () => fetchStudentAttendance({ section: sectionId, date, subject: subjectId || undefined, page_size: 100 }),
    enabled: !!sectionId && !!date,
  });

  const isLoadingRosterData = isLoadingRoster || isLoadingExisting;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="w-full max-w-[180px]">
          <Input type="date" label="Date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="w-full max-w-xs">
          <Select label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Choose a section</option>
            {sections?.map((section) => (
              <option key={section.id} value={section.id}>
                {section.school_class_name} - {section.name} ({section.academic_year_name})
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full max-w-[200px]">
          <Select label="Subject (optional)" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Daily (no subject)</option>
            {subjects?.results.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full max-w-[220px]">
          <Select label="Period (optional)" value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
            <option value="">Daily (no period)</option>
            {periods?.results.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isRosterError && <Alert tone="danger">{(rosterError as ApiError).message}</Alert>}

      {!sectionId ? (
        <EmptyState
          icon={Users}
          title="Pick a section"
          description="Choose a section above to load its roster and take attendance."
        />
      ) : isLoadingRosterData ? (
        <FullPageSpinner />
      ) : !roster || roster.results.length === 0 ? (
        <EmptyState icon={Users} title="No active students in this section" />
      ) : (
        <RosterEditor
          key={`${sectionId}|${date}|${subjectId}|${periodId}`}
          roster={roster}
          existing={existing}
          periodId={periodId}
          date={date}
          sectionId={sectionId}
          subjectId={subjectId}
          canCreate={canCreate}
        />
      )}
    </div>
  );
}
