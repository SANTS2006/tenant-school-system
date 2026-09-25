import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { fetchDepartments } from "@/features/academics/api";
import { useAllSections, useSchoolClasses } from "@/features/academics/useAcademicsLookups";
import type { ApiError } from "@/lib/api-client";
import { applyFieldErrors, generalErrorMessage } from "@/lib/formErrors";

import { targetTypeLabel } from "./statusTone";
import type { TargetType } from "./types";
import { useAnnouncement, useCreateAnnouncement, useUpdateAnnouncement } from "./useCommunicationsCrud";

const TARGET_TYPES: TargetType[] = [
  "school",
  "class",
  "section",
  "department",
  "staff",
  "students",
  "parents",
  "specific_users",
];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  target_type: z.enum(["school", "class", "section", "department", "staff", "students", "parents", "specific_users"]),
  target_class: z.string(),
  target_section: z.string(),
  target_department: z.string(),
  send_email: z.boolean(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  title: "",
  body: "",
  target_type: "school",
  target_class: "",
  target_section: "",
  target_department: "",
  send_email: false,
  is_active: true,
};
const FIELD_KEYS = new Set([
  "title",
  "body",
  "target_type",
  "target_class",
  "target_section",
  "target_department",
  "send_email",
  "is_active",
]);

export function AnnouncementFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: announcement, isLoading: isLoadingAnnouncement } = useAnnouncement(id);
  const { data: classes } = useSchoolClasses();
  const { data: sections } = useAllSections();
  const { data: departments } = useQuery({
    queryKey: ["academics", "departments", "lookup"],
    queryFn: () => fetchDepartments({ page_size: 100 }),
  });
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement(id ?? "");
  const mutation = isEditMode ? updateAnnouncement : createAnnouncement;
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY_VALUES });

  useEffect(() => {
    // Also re-fires once `classes`/`sections`/`departments` finish loading (not just when
    // `announcement` does): a native <select> silently ignores a value assigned before its
    // matching <option> exists in the DOM, and nothing re-applies it later on its own — so if
    // `announcement` resolves before these lookups do, `target_class`/`target_section`/
    // `target_department` would be silently dropped on the first `reset()` and never actually
    // selected.
    if (announcement) {
      reset({
        title: announcement.title,
        body: announcement.body,
        target_type: announcement.target_type,
        target_class: announcement.target_class ?? "",
        target_section: announcement.target_section ?? "",
        target_department: announcement.target_department ?? "",
        send_email: announcement.send_email,
        is_active: announcement.is_active,
      });
    }
  }, [announcement, classes, sections, departments, reset]);

  const onSubmit = (values: FormValues) => {
    setGeneralError(null);
    mutation.mutate(
      {
        title: values.title,
        body: values.body,
        target_type: values.target_type,
        target_class: values.target_class || undefined,
        target_section: values.target_section || undefined,
        target_department: values.target_department || undefined,
        send_email: values.send_email,
        is_active: values.is_active,
      },
      {
        onSuccess: () => {
          showToast({ title: isEditMode ? "Announcement updated" : "Announcement created" });
          navigate("/communications");
        },
        onError: (err: ApiError) => {
          if (!applyFieldErrors(err, setError, FIELD_KEYS)) {
            const message = generalErrorMessage(err);
            setGeneralError(message);
            showToast({ title: "Could not save announcement", description: message, tone: "danger" });
          }
        },
      },
    );
  };

  if (isEditMode && isLoadingAnnouncement) {
    return <FullPageSpinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">
        {isEditMode ? "Edit announcement" : "New announcement"}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>
            Announcement details
            {announcement?.published_by_name && (
              <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
                Published by {announcement.published_by_name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {generalError && (
            <Alert tone="danger" className="mb-4">
              {generalError}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Input label="Title" error={errors.title?.message} {...register("title")} />
            <Input label="Body" error={errors.body?.message} {...register("body")} />
            <Select label="Audience" error={errors.target_type?.message} {...register("target_type")}>
              {TARGET_TYPES.map((option) => (
                <option key={option} value={option}>
                  {targetTypeLabel(option)}
                </option>
              ))}
            </Select>
            <p className="text-sm text-[var(--color-text-muted)]">
              Class/Section narrow "Students"/"Parents"; Department narrows "Staff". Ignored by
              other audiences.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Class" error={errors.target_class?.message} {...register("target_class")}>
                <option value="">Not set</option>
                {classes?.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </Select>
              <Select label="Section" error={errors.target_section?.message} {...register("target_section")}>
                <option value="">Not set</option>
                {sections?.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.school_class_name} — {section.name}
                  </option>
                ))}
              </Select>
            </div>
            <Select label="Department" error={errors.target_department?.message} {...register("target_department")}>
              <option value="">Not set</option>
              {departments?.results.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
            <Checkbox label="Send email" hint="Also emails every resolved recipient via Brevo." {...register("send_email")} />
            <Checkbox label="Active" {...register("is_active")} />

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate("/communications")}>
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
