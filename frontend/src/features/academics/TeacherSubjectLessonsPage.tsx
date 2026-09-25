import { NotebookText, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { BackArrowIcon } from "@/components/ui/BackArrowIcon";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { useHasPermission } from "@/features/auth/useAuth";
import { useLessonList } from "@/features/education/useEducationCrud";
import type { ApiError } from "@/lib/api-client";

import { useSubjectOffering } from "./useAcademicsCrud";

/** Lessons for one subject offering — the existing lessons list narrowed to this offering's
 * subject and class, with "Add lesson" opening the lesson form pre-filled for both. */
export function TeacherSubjectLessonsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const canCreate = useHasPermission("education.create");

  const { data: offering, isLoading: isLoadingOffering } = useSubjectOffering(id);
  const {
    data: lessons,
    isLoading: isLoadingLessons,
    isError,
    error,
  } = useLessonList({
    page_size: 100,
    subject: offering?.subject,
    school_class: offering?.school_class,
  });

  if (isLoadingOffering) {
    return <FullPageSpinner />;
  }

  if (!offering) {
    return <Alert tone="danger">Subject not found.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate("/subjects")}
        className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text)]"
      >
        <BackArrowIcon className="size-4" />
        Back to subjects
      </button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">
            {offering.subject_name} — {offering.school_class_name} · Lessons
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{offering.term_name}</p>
        </div>
        {canCreate && (
          <Button
            onClick={() =>
              navigate(`/education/lessons/new?subject=${offering.subject}&school_class=${offering.school_class}`)
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add lesson
          </Button>
        )}
      </div>

      {isLoadingLessons ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : isError ? (
        <Alert tone="danger">{(error as ApiError).message}</Alert>
      ) : !lessons || lessons.results.length === 0 ? (
        <EmptyState
          icon={NotebookText}
          title="No lessons yet"
          description="Add the first lesson for this subject and class."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {lessons.results.map((lesson) => (
            <button
              key={lesson.id}
              type="button"
              onClick={() => navigate(`/education/lessons/${lesson.id}`)}
              className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg-subtle)] text-[var(--color-primary)]">
                <NotebookText className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-[var(--color-text)]">{lesson.title}</span>
                <span className="mt-0.5 block truncate text-sm text-[var(--color-text-muted)]">
                  {lesson.teacher_name} · {lesson.material_count} material{lesson.material_count === 1 ? "" : "s"}
                </span>
              </span>
              <Badge tone={lesson.is_active ? "success" : "neutral"}>{lesson.is_active ? "Active" : "Inactive"}</Badge>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
