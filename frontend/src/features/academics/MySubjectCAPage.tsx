import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { BackArrowIcon } from "@/components/ui/BackArrowIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
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
import type { ApiError } from "@/lib/api-client";

import { useMySubjectCA } from "./useAcademicsCrud";

export function MySubjectCAPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useMySubjectCA(id);

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return <Alert tone="danger">{(error as ApiError).message}</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate("/my-subjects")}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <BackArrowIcon className="size-4" />
        Back to my subjects
      </button>

      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Continuous Assessment</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Your scores on each assessment and your total CA so far.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total CA</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-[var(--color-text)]">
            {data?.total_ca ?? "—"}
            {data?.total_ca && <span className="text-sm font-normal text-[var(--color-text-muted)]"> / CA weight</span>}
          </p>
          {!data?.total_ca && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              No assessments have been submitted yet.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.assessments.length === 0 ? (
            <EmptyState title="No assessments yet" description="Your teacher hasn't added any assessments yet." />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Assessment</TableHeaderCell>
                    <TableHeaderCell>Score</TableHeaderCell>
                    <TableHeaderCell>Maximum</TableHeaderCell>
                    <TableHeaderCell>Weight</TableHeaderCell>
                    <TableHeaderCell>Weighted score</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {data.assessments.map((row) => (
                    <TableRow key={row.assessment}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.raw_score ?? "Not graded yet"}</TableCell>
                      <TableCell>{row.max_score}</TableCell>
                      <TableCell>{row.weight}%</TableCell>
                      <TableCell>{row.weighted_score ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
