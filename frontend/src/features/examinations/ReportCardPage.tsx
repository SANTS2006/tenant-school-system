import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
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
import { useTermList } from "@/features/academics/useAcademicsCrud";
import { listStudents } from "@/features/students/api";
import type { ApiError } from "@/lib/api-client";

import { useReportCard } from "./useResultsCrud";

export function ReportCardPage() {
  const [studentId, setStudentId] = useState("");
  const [termId, setTermId] = useState("");

  const { data: students } = useQuery({
    queryKey: ["students", "lookup", "active"],
    queryFn: () => listStudents({ status: "active", page_size: 100, ordering: "last_name" }),
  });
  const { data: terms } = useTermList({ page_size: 100 });

  const { data: reportCard, isLoading, isError, error } = useReportCard({
    student: studentId,
    term: termId || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <div className="w-full max-w-xs">
          <Select label="Student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Choose a student</option>
            {students?.results.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name} ({student.admission_number})
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full max-w-xs">
          <Select label="Term (optional)" value={termId} onChange={(e) => setTermId(e.target.value)}>
            <option value="">All terms</option>
            {terms?.results.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name} ({term.academic_year_name})
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isError && <Alert tone="danger">{(error as ApiError).message}</Alert>}

      {!studentId ? (
        <EmptyState icon={FileText} title="Pick a student" description="Choose a student above to view their report card." />
      ) : isLoading ? (
        <FullPageSpinner />
      ) : reportCard && reportCard.results.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No published results yet"
          description="Only published or locked results appear on a report card."
        />
      ) : reportCard ? (
        <>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{reportCard.student.name}</h2>
            {reportCard.average !== null && (
              <p className="text-sm text-[var(--color-text-muted)]">Average score: {reportCard.average}</p>
            )}
          </div>
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Subject</TableHeaderCell>
                  <TableHeaderCell>Exam</TableHeaderCell>
                  <TableHeaderCell>Exam score</TableHeaderCell>
                  <TableHeaderCell>CA</TableHeaderCell>
                  <TableHeaderCell>Final score</TableHeaderCell>
                  <TableHeaderCell>Grade</TableHeaderCell>
                  <TableHeaderCell>Comment</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {reportCard.results.map((entry, index) => (
                  <TableRow key={`${entry.subject}-${entry.exam}-${index}`}>
                    <TableCell className="font-medium">{entry.subject}</TableCell>
                    <TableCell>{entry.exam}</TableCell>
                    <TableCell>{entry.exam_score ?? <span className="text-[var(--color-text-muted)]">—</span>}</TableCell>
                    <TableCell>{entry.ca_score ?? <span className="text-[var(--color-text-muted)]">—</span>}</TableCell>
                    <TableCell>
                      {entry.score ?? <span className="text-[var(--color-text-muted)]">—</span>} / {entry.max_score}
                    </TableCell>
                    <TableCell>{entry.grade || <span className="text-[var(--color-text-muted)]">—</span>}</TableCell>
                    <TableCell>{entry.teacher_comment || <span className="text-[var(--color-text-muted)]">—</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : null}
    </div>
  );
}
