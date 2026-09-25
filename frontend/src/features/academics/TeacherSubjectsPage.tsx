import { Award, BookOpen, ClipboardCheck, MessageSquare, NotebookText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullPageSpinner } from "@/components/ui/Spinner";
import type { ApiError } from "@/lib/api-client";

import { useSubjectOfferingList } from "./useAcademicsCrud";

const ACTION_CLASS =
  "flex flex-col items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2 py-3 text-xs font-medium text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

/** The teacher's own Subjects page: every subject offering they teach (the API already scopes the
 * list to the signed-in teacher), each with shortcuts to its roster, lessons, CA workflow, exam
 * results and communications. */
export function TeacherSubjectsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useSubjectOfferingList({ page_size: 100 });

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return <Alert tone="danger">{(error as ApiError).message}</Alert>;
  }

  const offerings = data?.results ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Subjects</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          The subjects you teach. Manage each subject's students, lessons and continuous assessment.
        </p>
      </div>

      {offerings.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects assigned"
          description="You haven't been assigned to teach any subjects yet — check with your school administrator."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {offerings.map((offering) => {
            const base = `/academics/subject-offerings/${offering.id}`;
            return (
              <article
                key={offering.id}
                className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
              >
                <div className="h-1.5 bg-[image:var(--gradient-primary)]" aria-hidden="true" />
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-white shadow-[0_8px_20px_-8px_rgba(21,101,192,0.7)]">
                      <BookOpen className="size-6" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold text-[var(--color-text)]">
                        {offering.subject_name}
                      </h2>
                      <p className="truncate text-sm text-[var(--color-text-muted)]">
                        {offering.school_class_name} · {offering.term_name}
                      </p>
                    </div>
                    <Badge tone={offering.ca_status === "closed" ? "danger" : "success"}>
                      CA {offering.ca_status === "closed" ? "closed" : "open"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[var(--color-text)]">
                      CA {offering.ca_weight_percent}%
                    </span>
                    <span className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[var(--color-text)]">
                      Exam {offering.exam_weight_percent}%
                    </span>
                    <span className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[var(--color-text-muted)]">
                      Pass mark {offering.pass_mark}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" className={ACTION_CLASS} onClick={() => navigate(`${base}/students`)}>
                      <Users className="size-5" aria-hidden="true" />
                      Students
                    </button>
                    <button type="button" className={ACTION_CLASS} onClick={() => navigate(`/subjects/${offering.id}/lessons`)}>
                      <NotebookText className="size-5" aria-hidden="true" />
                      Lessons
                    </button>
                    <button type="button" className={ACTION_CLASS} onClick={() => navigate(`${base}/ca`)}>
                      <ClipboardCheck className="size-5" aria-hidden="true" />
                      CA
                    </button>
                    <button type="button" className={ACTION_CLASS} onClick={() => navigate(`${base}/results`)}>
                      <Award className="size-5" aria-hidden="true" />
                      Exam results
                    </button>
                    <button
                      type="button"
                      className={`${ACTION_CLASS} col-span-2`}
                      onClick={() => navigate(`${base}/communications`)}
                    >
                      <MessageSquare className="size-5" aria-hidden="true" />
                      Materials & messages
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
