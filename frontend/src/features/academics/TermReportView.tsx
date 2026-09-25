import { Printer } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { LogoBadge } from "@/layouts/AppShell";
import type { School } from "@/features/schools/types";

import type { PassStatus, PromotionStatus, TermReport } from "./types";

const PASS_STATUS_LABEL: Record<PassStatus, string> = {
  pass: "PASS",
  near_pass: "NEAR PASS",
  fail: "FAIL",
  incomplete: "INCOMPLETE",
};

const PASS_STATUS_TONE: Record<PassStatus, BadgeTone> = {
  pass: "success",
  near_pass: "warning",
  fail: "danger",
  incomplete: "neutral",
};

const PROMOTION_STATUS_LABEL: Record<PromotionStatus, string> = {
  promoted: "PROMOTED",
  repeated: "FAILED — REPEAT",
  public_exam_required: "PUBLIC EXAMINATION REQUIRED",
};

interface TermReportViewProps {
  report: TermReport;
  studentName: string;
  school?: Pick<School, "name" | "logo" | "address" | "phone_number" | "email"> | null;
  showPrintButton?: boolean;
}

export function TermReportView({ report, studentName, school, showPrintButton = true }: TermReportViewProps) {
  return (
    <div className="flex flex-col gap-6">
      {showPrintButton && (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden="true" />
            Print
          </Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center gap-3">
          <LogoBadge logoUrl={school?.logo} className="size-12" />
          <div className="min-w-0">
            <CardTitle className="truncate text-base font-semibold text-[var(--color-text)]">
              {school?.name ?? "School"}
            </CardTitle>
            <p className="truncate text-sm text-[var(--color-text-muted)]">
              {[school?.address, school?.phone_number, school?.email].filter(Boolean).join(" · ")}
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <p className="text-sm text-[var(--color-text)]">
            <span className="font-medium">{studentName}</span>
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            {report.school_class_name} · {report.term_name}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject results</CardTitle>
        </CardHeader>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <tr>
                  <TableHeaderCell>Subject</TableHeaderCell>
                  <TableHeaderCell>CA</TableHeaderCell>
                  <TableHeaderCell>Exam</TableHeaderCell>
                  <TableHeaderCell>Final</TableHeaderCell>
                  <TableHeaderCell>Pass mark</TableHeaderCell>
                  <TableHeaderCell>Remark</TableHeaderCell>
                </tr>
              </TableHead>
              <TableBody>
                {report.subjects.map((subject) => (
                  <TableRow key={subject.subject_name}>
                    <TableCell className="font-medium">{subject.subject_name}</TableCell>
                    <TableCell>{subject.ca_contribution ?? "—"}</TableCell>
                    <TableCell>{subject.exam_contribution ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{subject.final_score ?? "—"}</TableCell>
                    <TableCell>{subject.pass_mark}%</TableCell>
                    <TableCell>
                      <Badge tone={PASS_STATUS_TONE[subject.pass_status]}>
                        {PASS_STATUS_LABEL[subject.pass_status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[var(--color-text-muted)]">Total subjects</dt>
              <dd className="font-medium text-[var(--color-text)]">{report.total_subjects}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Passed</dt>
              <dd className="font-medium text-[var(--color-text)]">{report.passed}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Failed</dt>
              <dd className="font-medium text-[var(--color-text)]">{report.failed}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Term %</dt>
              <dd className="font-medium text-[var(--color-text)]">{report.term_percentage ?? "Incomplete"}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Class position</dt>
              <dd className="font-medium text-[var(--color-text)]">{report.position ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Promotion threshold</dt>
              <dd className="font-medium text-[var(--color-text)]">{report.threshold_percent}%</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Overall %</dt>
              <dd className="font-medium text-[var(--color-text)]">{report.overall_percent ?? "Incomplete"}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-text-muted)]">Promotion status</dt>
              <dd className="font-medium text-[var(--color-text)]">
                {report.promotion_status ? PROMOTION_STATUS_LABEL[report.promotion_status] : "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
