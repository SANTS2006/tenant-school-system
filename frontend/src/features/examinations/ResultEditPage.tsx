import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import type { ApiError } from "@/lib/api-client";
import { applyFieldErrors, generalErrorMessage } from "@/lib/formErrors";

import { resultStatusLabel, resultStatusTone } from "./resultStatusTone";
import { useResult, useUpdateResult } from "./useResultsCrud";

const schema = z.object({
  exam_score: z.string(),
  teacher_comment: z.string(),
});

type FormValues = z.infer<typeof schema>;

const FIELD_KEYS = new Set(["exam_score", "teacher_comment"]);

export function ResultEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: result, isLoading } = useResult(id);
  const updateResult = useUpdateResult(id ?? "");
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { exam_score: "", teacher_comment: "" } });

  useEffect(() => {
    if (result) {
      reset({ exam_score: result.exam_score ?? "", teacher_comment: result.teacher_comment });
    }
  }, [result, reset]);

  const onSubmit = (values: FormValues) => {
    setGeneralError(null);
    updateResult.mutate(
      { exam_score: values.exam_score || undefined, teacher_comment: values.teacher_comment || undefined },
      {
        onSuccess: () => {
          showToast({ title: "Result updated" });
          navigate("/examinations/results");
        },
        onError: (err: ApiError) => {
          if (!applyFieldErrors(err, setError, FIELD_KEYS)) {
            const message = generalErrorMessage(err);
            setGeneralError(message);
            showToast({ title: "Could not save result", description: message, tone: "danger" });
          }
        },
      },
    );
  };

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!result) {
    return <Alert tone="danger">Result not found.</Alert>;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">Edit result</h1>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-[var(--color-text)]">{result.student_name}</CardTitle>
            <p className="text-sm text-[var(--color-text-muted)]">{result.exam_schedule_label}</p>
          </div>
          <Badge tone={resultStatusTone(result.status)}>{resultStatusLabel(result.status)}</Badge>
        </CardHeader>
        <CardContent>
          {generalError && (
            <Alert tone="danger" className="mb-4">
              {generalError}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Input
              type="number"
              step="0.01"
              label="Exam score"
              hint="The exam-portion score only — CA is added automatically."
              error={errors.exam_score?.message}
              {...register("exam_score")}
            />
            <div className="grid grid-cols-2 gap-4 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-sm">
              <div>
                <p className="text-[var(--color-text-muted)]">CA (auto)</p>
                <p className="font-medium text-[var(--color-text)]">
                  {result.ca_score ?? <span className="text-[var(--color-text-muted)]">Not graded yet</span>}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)]">Final score</p>
                <p className="font-medium text-[var(--color-text)]">
                  {result.score ?? <span className="text-[var(--color-text-muted)]">Pending</span>}
                </p>
              </div>
            </div>
            <Input label="Comment" error={errors.teacher_comment?.message} {...register("teacher_comment")} />

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate("/examinations/results")}>
                Cancel
              </Button>
              <Button type="submit" isLoading={updateResult.isPending}>
                {!updateResult.isPending && <Save className="size-4" aria-hidden="true" />}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
