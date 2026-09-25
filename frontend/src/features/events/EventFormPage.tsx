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
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { fetchDepartments } from "@/features/academics/api";
import { useAllSections, useSchoolClasses } from "@/features/academics/useAcademicsLookups";
import type { ApiError } from "@/lib/api-client";
import { applyFieldErrors, generalErrorMessage } from "@/lib/formErrors";

import { categoryLabel, targetTypeLabel } from "./statusTone";
import type { EventCategory, TargetType } from "./types";
import { useCreateEvent, useEvent, useUpdateEvent } from "./useEventsCrud";

const CATEGORIES: EventCategory[] = ["academic", "sports", "cultural", "meeting", "holiday", "other"];
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

const schema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    category: z.enum(["academic", "sports", "cultural", "meeting", "holiday", "other"]),
    start_datetime: z.string().min(1, "Start date/time is required"),
    end_datetime: z.string().min(1, "End date/time is required"),
    location: z.string(),
    capacity: z.string(),
    target_type: z.enum(["school", "class", "section", "department", "staff", "students", "parents", "specific_users"]),
    target_class: z.string(),
    target_section: z.string(),
    target_department: z.string(),
  })
  .refine((values) => values.end_datetime >= values.start_datetime, {
    message: "Must be on or after the start date/time.",
    path: ["end_datetime"],
  });

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  title: "",
  description: "",
  category: "other",
  start_datetime: "",
  end_datetime: "",
  location: "",
  capacity: "",
  target_type: "school",
  target_class: "",
  target_section: "",
  target_department: "",
};
const FIELD_KEYS = new Set([
  "title", "description", "category", "start_datetime", "end_datetime", "location", "capacity",
  "target_type", "target_class", "target_section", "target_department",
]);

/** The backend stores UTC ISO datetimes; a `datetime-local` input works in naive local time with
 * no timezone/seconds ("YYYY-MM-DDTHH:mm") — converting each direction here keeps the picker
 * showing the same wall-clock time the event was actually created with. */
function toLocalInputValue(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EventFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: event, isLoading: isLoadingEvent } = useEvent(id);
  const { data: classes } = useSchoolClasses();
  const { data: sections } = useAllSections();
  const { data: departments } = useQuery({
    queryKey: ["academics", "departments", "lookup"],
    queryFn: () => fetchDepartments({ page_size: 100 }),
  });
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent(id ?? "");
  const mutation = isEditMode ? updateEvent : createEvent;
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY_VALUES });

  useEffect(() => {
    // Also re-fires once `classes`/`sections`/`departments` finish loading — see
    // AnnouncementFormPage for why: a native <select> silently drops a value assigned before its
    // matching <option> exists in the DOM.
    if (event) {
      reset({
        title: event.title,
        description: event.description,
        category: event.category,
        start_datetime: toLocalInputValue(event.start_datetime),
        end_datetime: toLocalInputValue(event.end_datetime),
        location: event.location,
        capacity: event.capacity === null ? "" : String(event.capacity),
        target_type: event.target_type,
        target_class: event.target_class ?? "",
        target_section: event.target_section ?? "",
        target_department: event.target_department ?? "",
      });
    }
  }, [event, classes, sections, departments, reset]);

  const onSubmit = (values: FormValues) => {
    setGeneralError(null);
    mutation.mutate(
      {
        title: values.title,
        description: values.description || undefined,
        category: values.category,
        start_datetime: values.start_datetime,
        end_datetime: values.end_datetime,
        location: values.location || undefined,
        capacity: values.capacity ? Number(values.capacity) : undefined,
        target_type: values.target_type,
        target_class: values.target_class || undefined,
        target_section: values.target_section || undefined,
        target_department: values.target_department || undefined,
      },
      {
        onSuccess: (saved) => {
          showToast({ title: isEditMode ? "Event updated" : "Event created" });
          navigate(`/events/${saved.id}`);
        },
        onError: (err: ApiError) => {
          if (!applyFieldErrors(err, setError, FIELD_KEYS)) {
            const message = generalErrorMessage(err);
            setGeneralError(message);
            showToast({ title: "Could not save event", description: message, tone: "danger" });
          }
        },
      },
    );
  };

  if (isEditMode && isLoadingEvent) {
    return <FullPageSpinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">{isEditMode ? "Edit event" : "New event"}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent>
          {generalError && (
            <Alert tone="danger" className="mb-4">
              {generalError}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Input label="Title" error={errors.title?.message} {...register("title")} />
            <Input label="Description" error={errors.description?.message} {...register("description")} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Category" error={errors.category?.message} {...register("category")}>
                {CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {categoryLabel(option)}
                  </option>
                ))}
              </Select>
              <Input label="Location" error={errors.location?.message} {...register("location")} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                type="datetime-local"
                label="Starts"
                error={errors.start_datetime?.message}
                {...register("start_datetime")}
              />
              <Input
                type="datetime-local"
                label="Ends"
                error={errors.end_datetime?.message}
                {...register("end_datetime")}
              />
            </div>
            <Input
              type="number"
              label="Capacity"
              hint="Leave blank for unlimited attendance."
              error={errors.capacity?.message}
              {...register("capacity")}
            />

            <Select label="Audience" error={errors.target_type?.message} {...register("target_type")}>
              {TARGET_TYPES.map((option) => (
                <option key={option} value={option}>
                  {targetTypeLabel(option)}
                </option>
              ))}
            </Select>
            <p className="text-sm text-[var(--color-text-muted)]">
              Class/Section narrow "Students"/"Parents"; Department narrows "Staff". Ignored by other
              audiences.
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

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate("/events")}>
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
