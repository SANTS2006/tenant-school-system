import { BookOpen, ClipboardCheck, FileText, MessageSquare, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullPageSpinner } from "@/components/ui/Spinner";
import type { ApiError } from "@/lib/api-client";

import { useMySubjects } from "./useAcademicsCrud";

const ACTION_CLASS =
  "flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2 py-3 text-xs font-medium text-[var(--color-text)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

export function MySubjectsPage() {
  const navigate = useNavigate();
  const { data: subjects, isLoading, isError, error } = useMySubjects();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return <Alert tone="danger">{(error as ApiError).message}</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Subjects</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          The subjects you're enrolled in this term, with their teacher and grading split.
        </p>
      </div>

      {!subjects || subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="You haven't been enrolled into any subjects yet — check with your school administrator."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <article
              key={subject.id}
              className="group overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
            >
              <div className="h-1.5 bg-[image:var(--gradient-primary)]" aria-hidden="true" />
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[image:var(--gradient-primary)] text-white shadow-[0_8px_20px_-8px_rgba(21,101,192,0.7)]">
                    <BookOpen className="size-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-[var(--color-text)]">{subject.subject_name}</h2>
                    <p className="truncate text-sm text-[var(--color-text-muted)]">
                      {subject.school_class_name} · {subject.term_name}
                    </p>
                  </div>
                </div>

                <p className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                  <UserRound className="size-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
                  <span className="truncate">
                    {subject.main_teacher_name}
                    {subject.assistant_teacher_name && ` + ${subject.assistant_teacher_name}`}
                  </span>
                </p>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[var(--color-text)]">
                    CA {subject.ca_weight_percent}%
                  </span>
                  <span className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[var(--color-text)]">
                    Exam {subject.exam_weight_percent}%
                  </span>
                  <span className="rounded-full bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[var(--color-text-muted)]">
                    Pass mark {subject.pass_mark}%
                  </span>
                </div>

                <div className="flex gap-2">
                  <button type="button" className={ACTION_CLASS} onClick={() => navigate(`/my-subjects/${subject.id}/ca`)}>
                    <ClipboardCheck className="size-5" aria-hidden="true" />
                    CA
                  </button>
                  <button
                    type="button"
                    className={ACTION_CLASS}
                    onClick={() => navigate(`/my-subjects/${subject.id}/communications#materials`)}
                  >
                    <FileText className="size-5" aria-hidden="true" />
                    Materials
                  </button>
                  <button
                    type="button"
                    className={ACTION_CLASS}
                    onClick={() => navigate(`/my-subjects/${subject.id}/communications#messages`)}
                  >
                    <MessageSquare className="size-5" aria-hidden="true" />
                    Messages
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
