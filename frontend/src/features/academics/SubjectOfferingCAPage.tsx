import { Lock, LockOpen, Plus, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { BackArrowIcon } from "@/components/ui/BackArrowIcon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
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
import type { ApiError } from "@/lib/api-client";

import { useSubjectsHomePath } from "./useSubjectsHomePath";
import {
  useAssessmentList,
  useCloseSubjectOfferingCA,
  useCreateAssessment,
  useDeleteAssessment,
  useReopenSubjectOfferingCA,
  useSubjectOffering,
  useSubjectOfferingCaSummary,
} from "./useAcademicsCrud";

export function SubjectOfferingCAPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const subjectsHome = useSubjectsHomePath();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const { data: offering, isLoading: isLoadingOffering } = useSubjectOffering(id);
  const { data: assessments, isLoading: isLoadingAssessments } = useAssessmentList({
    page_size: 100,
    subject_offering: id,
  });
  const { data: caSummary, isLoading: isLoadingSummary } = useSubjectOfferingCaSummary(id);
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const createAssessment = useCreateAssessment();
  const deleteAssessment = useDeleteAssessment();
  const closeCA = useCloseSubjectOfferingCA();
  const reopenCA = useReopenSubjectOfferingCA();

  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [showReopenForm, setShowReopenForm] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const handleAddAssessment = () => {
    if (!id || !name.trim() || !weight) return;
    createAssessment.mutate(
      { subject_offering: id, name: name.trim(), weight: Number(weight), max_score: maxScore },
      {
        onSuccess: () => {
          showToast({ title: "Assessment added" });
          setName("");
          setWeight("");
          setMaxScore("100");
        },
        onError: (err: ApiError) => showToast({ title: "Could not add assessment", description: err.message, tone: "danger" }),
      },
    );
  };

  const handleDelete = async (assessmentId: string, label: string) => {
    const ok = await confirm({ title: `Delete "${label}"?`, description: "This cannot be undone.", tone: "danger" });
    if (!ok) return;
    deleteAssessment.mutate(assessmentId, {
      onSuccess: () => showToast({ title: "Assessment deleted" }),
      onError: (err: ApiError) => showToast({ title: "Could not delete assessment", description: err.message, tone: "danger" }),
    });
  };

  const handleClose = async () => {
    if (!id) return;
    const ok = await confirm({
      title: "Close CA for this subject?",
      description: "Teachers will no longer be able to add or edit assessments or scores until it's reopened.",
      tone: "danger",
    });
    if (!ok) return;
    closeCA.mutate(id, {
      onSuccess: () => showToast({ title: "CA closed" }),
      onError: (err: ApiError) => showToast({ title: "Could not close CA", description: err.message, tone: "danger" }),
    });
  };

  const handleReopen = () => {
    if (!id || !reopenReason.trim()) return;
    reopenCA.mutate(
      { id, reason: reopenReason.trim() },
      {
        onSuccess: () => {
          showToast({ title: "CA reopened" });
          setShowReopenForm(false);
          setReopenReason("");
        },
        onError: (err: ApiError) => showToast({ title: "Could not reopen CA", description: err.message, tone: "danger" }),
      },
    );
  };

  if (isLoadingOffering) {
    return <FullPageSpinner />;
  }

  if (!offering) {
    return <Alert tone="danger">Subject offering not found.</Alert>;
  }

  const isClosed = offering.ca_status === "closed";

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate(subjectsHome)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <BackArrowIcon className="size-4" />
        {subjectsHome === "/subjects" ? "Back to subjects" : "Back to subject offerings"}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">
            {offering.subject_name} — {offering.school_class_name} · Continuous Assessment
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {offering.term_name} · {offering.main_teacher_name}
          </p>
        </div>
        <Badge tone={isClosed ? "danger" : "success"}>{isClosed ? "CA Closed" : "CA Open"}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CA allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex justify-between text-sm text-[var(--color-text)]">
            <span>
              Configured: <strong>{offering.ca_weight_percent}%</strong>
            </span>
            <span>
              Allocated: <strong>{offering.ca_allocated_percent}%</strong>
            </span>
            <span>
              Remaining: <strong>{offering.ca_remaining_percent}%</strong>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
            <div
              className="h-full rounded-full bg-[image:var(--gradient-primary)] transition-all"
              style={{
                width: `${Math.min(100, (offering.ca_allocated_percent / Math.max(offering.ca_weight_percent, 1)) * 100)}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center gap-3">
            {!isClosed ? (
              <Button variant="secondary" size="sm" onClick={handleClose} isLoading={closeCA.isPending}>
                <Lock className="size-4" aria-hidden="true" />
                Close CA
              </Button>
            ) : !showReopenForm ? (
              <Button variant="secondary" size="sm" onClick={() => setShowReopenForm(true)}>
                <LockOpen className="size-4" aria-hidden="true" />
                Reopen CA
              </Button>
            ) : (
              <div className="flex flex-1 flex-wrap items-end gap-2">
                <div className="min-w-[220px] flex-1">
                  <Input
                    label="Reason for reopening"
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                  />
                </div>
                <Button size="sm" onClick={handleReopen} disabled={!reopenReason.trim()} isLoading={reopenCA.isPending}>
                  Confirm reopen
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setShowReopenForm(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
          {offering.ca_closed_at && isClosed && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Closed on {new Date(offering.ca_closed_at).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {!isClosed && (
        <Card>
          <CardHeader>
            <CardTitle>Add an assessment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <Input label="Name" placeholder="e.g. Assignment 1" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="w-28">
              <Input label="Weight %" type="number" min={1} max={100} value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="w-28">
              <Input label="Max score" type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
            </div>
            <Button onClick={handleAddAssessment} disabled={!name.trim() || !weight} isLoading={createAssessment.isPending}>
              {!createAssessment.isPending && <Plus className="size-4" aria-hidden="true" />}
              Add
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingAssessments ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : !assessments || assessments.results.length === 0 ? (
            <EmptyState title="No assessments yet" description="Add one above to start entering continuous assessment scores." />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Weight</TableHeaderCell>
                    <TableHeaderCell>Max score</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell className="text-right">Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {assessments.results.map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-medium">{assessment.name}</TableCell>
                      <TableCell>{assessment.weight}%</TableCell>
                      <TableCell>{assessment.max_score}</TableCell>
                      <TableCell>
                        <Badge tone={assessment.status === "active" ? "success" : "neutral"}>
                          {assessment.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/academics/assessments/${assessment.id}/scores`)}
                          >
                            Grade entry
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleDelete(assessment.id, assessment.name)}
                            aria-label={`Delete ${assessment.name}`}
                            className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-danger)]"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students&apos; CA</CardTitle>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Each student&apos;s total so far (submitted scores only, out of {offering?.ca_weight_percent ?? "—"}). Select a
            student to see the full breakdown.
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingSummary ? (
            <Spinner />
          ) : !caSummary || caSummary.students.length === 0 ? (
            <EmptyState title="No students yet" description="No students are registered for this subject." />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Student</TableHeaderCell>
                    <TableHeaderCell>Admission #</TableHeaderCell>
                    <TableHeaderCell className="text-right">Total CA</TableHeaderCell>
                  </tr>
                </TableHead>
                <TableBody>
                  {caSummary.students.map((student) => {
                    const isOpen = openStudentId === student.student;
                    return (
                      <Fragment key={student.student}>
                        <TableRow
                          className="cursor-pointer hover:bg-[var(--color-bg-subtle)]"
                          onClick={() => setOpenStudentId(isOpen ? null : student.student)}
                          aria-expanded={isOpen}
                        >
                          <TableCell className="font-medium">{student.student_name}</TableCell>
                          <TableCell>{student.admission_number}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {student.total_ca ?? <span className="text-[var(--color-text-muted)]">—</span>}
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow>
                            <TableCell colSpan={3} className="bg-[var(--color-bg-subtle)]">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-[var(--color-text-muted)]">
                                    <th className="py-1 pr-3 font-medium">Assessment</th>
                                    <th className="py-1 pr-3 font-medium">Weight</th>
                                    <th className="py-1 pr-3 font-medium">Score</th>
                                    <th className="py-1 pr-3 font-medium">Counts as</th>
                                    <th className="py-1 font-medium">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {student.breakdown.map((row) => (
                                    <tr key={row.assessment}>
                                      <td className="py-1 pr-3">{row.name}</td>
                                      <td className="py-1 pr-3">{row.weight}%</td>
                                      <td className="py-1 pr-3">
                                        {row.raw_score !== null ? `${row.raw_score} / ${row.max_score}` : "—"}
                                      </td>
                                      <td className="py-1 pr-3">{row.weighted_score ?? "—"}</td>
                                      <td className="py-1">
                                        {row.status === "submitted" ? (
                                          <Badge tone="success">Submitted</Badge>
                                        ) : row.status === "draft" ? (
                                          <Badge tone="warning">Draft</Badge>
                                        ) : (
                                          <Badge tone="neutral">Not graded</Badge>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="border-t border-[var(--color-border)] font-semibold">
                                    <td className="pt-2" colSpan={3}>Total CA</td>
                                    <td className="pt-2" colSpan={2}>{student.total_ca ?? "—"}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
