import { BookOpen, FileText, Video } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FullPageSpinner } from "@/components/ui/Spinner";
import type { ApiError } from "@/lib/api-client";

import { useMyLessons } from "./useEducationCrud";

export function MyLessonsPage() {
  const { data: lessons, isLoading, isError, error } = useMyLessons();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError) {
    return <Alert tone="danger">{(error as ApiError).message}</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">My Lessons</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Notes, documents, and videos your teachers have posted for your class.
        </p>
      </div>

      {!lessons || lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No lessons yet"
          description="Your teachers haven't posted any lessons for your class yet."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader>
                <CardTitle className="truncate text-base font-semibold text-[var(--color-text)]">
                  {lesson.title}
                </CardTitle>
                <p className="truncate text-sm text-[var(--color-text-muted)]">{lesson.subject_name}</p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {lesson.description && <p className="text-sm text-[var(--color-text)]">{lesson.description}</p>}
                {lesson.materials.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">No materials posted yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {lesson.materials.map((material) =>
                      material.material_type === "video" ? (
                        <div key={material.id} className="flex flex-col gap-2">
                          <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-text)]">
                            <Video className="size-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
                            <span className="truncate">{material.title}</span>
                          </p>
                          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                          <video src={material.file} controls className="w-full rounded-[var(--radius-md)]" />
                        </div>
                      ) : (
                        <a
                          key={material.id}
                          href={material.file}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 text-sm font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                        >
                          <FileText className="size-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{material.title}</span>
                        </a>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
