import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import type { ApiError } from "@/lib/api-client";

import { useCreateSubject, useDepartmentList, useSubject, useUpdateSubject } from "./useAcademicsCrud";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string(),
  department: z.string(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = { name: "", code: "", department: "" };

export function SubjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: subject, isLoading: isLoadingSubject } = useSubject(id);
  const { data: departments } = useDepartmentList({ page_size: 100 });
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject(id ?? "");
  const mutation = isEditMode ? updateSubject : createSubject;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY_VALUES });

  useEffect(() => {
    if (subject) {
      reset({ name: subject.name, code: subject.code, department: subject.department ?? "" });
    }
  }, [subject, reset]);

  const onSubmit = (values: FormValues) => {
    mutation.mutate(
      {
        name: values.name,
        code: values.code || undefined,
        department: values.department || undefined,
      },
      {
        onSuccess: () => {
          showToast({ title: isEditMode ? "Subject updated" : "Subject created" });
          navigate("/academics/subjects");
        },
        onError: (err: ApiError) => {
          showToast({ title: "Could not save subject", description: err.message, tone: "danger" });
        },
      },
    );
  };

  if (isEditMode && isLoadingSubject) {
    return <FullPageSpinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">
        {isEditMode ? "Edit subject" : "New subject"}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Subject details</CardTitle>
        </CardHeader>
        <CardContent>
          {mutation.isError && (
            <Alert tone="danger" className="mb-4">
              {(mutation.error as ApiError).message}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Input label="Name" placeholder="Mathematics" error={errors.name?.message} {...register("name")} />
            <Input label="Code" placeholder="MATH" error={errors.code?.message} {...register("code")} />
            <Select label="Department" error={errors.department?.message} {...register("department")}>
              <option value="">Not set</option>
              {departments?.results.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate("/academics/subjects")}>
                Cancel
              </Button>
              <Button type="submit" isLoading={mutation.isPending}>
                {!mutation.isPending && <Save className="size-4" aria-hidden="true" />}
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
