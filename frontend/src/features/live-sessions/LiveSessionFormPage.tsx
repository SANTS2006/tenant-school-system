import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useAllSections, useSchoolClasses, useSubjects } from "@/features/academics/useAcademicsLookups";
import { listStudents } from "@/features/students/api";
import type { ApiError } from "@/lib/api-client";
import { applyFieldErrors, generalErrorMessage } from "@/lib/formErrors";

import { useCreateLiveSession, useCreateLiveSessionRecipient } from "./useLiveSessionsCrud";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1, "Subject is required"),
  school_class: z.string().min(1, "Class is required"),
  section: z.string(),
  scheduled_start: z.string().min(1, "Start time is required"),
  target_type: z.enum(["class_section", "specific_students"]),
});

type FormValues = z.infer<typeof schema>;

const FIELD_KEYS = new Set(["title", "subject", "school_class", "section", "scheduled_start", "target_type"]);

export function LiveSessionFormPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: subjects } = useSubjects();
  const { data: classes } = useSchoolClasses();
  const { data: sections } = useAllSections();
  const createSession = useCreateLiveSession();
  const createRecipient = useCreateLiveSessionRecipient();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [invitingIndex, setInvitingIndex] = useState<number | null>(null);

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      subject: "",
      school_class: "",
      section: "",
      scheduled_start: "",
      target_type: "class_section",
    },
  });

  const targetType = watch("target_type");
  const rosterClassId = watch("school_class");

  const { data: roster } = useQuery({
    queryKey: ["students", "roster-for-live-session", rosterClassId],
    queryFn: () => listStudents({ current_class: rosterClassId, status: "active", page_size: 100, ordering: "last_name" }),
    enabled: !!rosterClassId && targetType === "specific_students",
  });

  const onSubmit = (values: FormValues) => {
    setGeneralError(null);
    createSession.mutate(
      {
        title: values.title,
        subject: values.subject,
        school_class: values.school_class,
        section: values.section || undefined,
        scheduled_start: values.scheduled_start,
        target_type: values.target_type,
      },
      {
        onSuccess: async (saved) => {
          if (values.target_type === "specific_students" && selectedStudentIds.size > 0) {
            const studentIds = [...selectedStudentIds];
            let inviteFailures = 0;
            for (let i = 0; i < studentIds.length; i++) {
              setInvitingIndex(i);
              try {
                await createRecipient.mutateAsync({ session: saved.id, student: studentIds[i] });
              } catch {
                inviteFailures += 1;
              }
            }
            setInvitingIndex(null);
            if (inviteFailures > 0) {
              showToast({
                title: "Live session scheduled",
                description: `${inviteFailures} of ${studentIds.length} invite(s) failed — you can retry from the session page.`,
                tone: "danger",
              });
              navigate("/live-sessions");
              return;
            }
          }
          showToast({ title: "Live session scheduled" });
          navigate("/live-sessions");
        },
        onError: (err: ApiError) => {
          if (!applyFieldErrors(err, setError, FIELD_KEYS)) {
            const message = generalErrorMessage(err);
            setGeneralError(message);
            showToast({ title: "Could not schedule session", description: message, tone: "danger" });
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">Schedule a live session</h1>

      <Card>
        <CardHeader>
          <CardTitle>Session details</CardTitle>
        </CardHeader>
        <CardContent>
          {generalError && (
            <Alert tone="danger" className="mb-4">
              {generalError}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Input label="Title" error={errors.title?.message} {...register("title")} />
            <Select label="Subject" error={errors.subject?.message} {...register("subject")}>
              <option value="">Select a subject</option>
              {subjects?.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="Class" error={errors.school_class?.message} {...register("school_class")}>
                <option value="">Select a class</option>
                {classes?.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </Select>
              <Select label="Section" error={errors.section?.message} {...register("section")}>
                <option value="">Not set (whole class)</option>
                {sections?.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.school_class_name} — {section.name}
                  </option>
                ))}
              </Select>
            </div>
            <Input
              type="datetime-local"
              label="Scheduled start"
              error={errors.scheduled_start?.message}
              {...register("scheduled_start")}
            />

            <Select
              label="Audience"
              hint="Class / Section reaches everyone in the class (or section, if set) above. Specific Students reaches only the students you pick below, regardless of class/section."
              error={errors.target_type?.message}
              {...register("target_type")}
            >
              <option value="class_section">Class / Section</option>
              <option value="specific_students">Specific Students</option>
            </Select>

            {targetType === "specific_students" && (
              <div className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                <p className="text-sm font-medium text-[var(--color-text)]">Recipients</p>
                {!rosterClassId ? (
                  <p className="text-sm text-[var(--color-text-muted)]">Select a class above to choose students.</p>
                ) : !roster || roster.results.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">No active students in this class.</p>
                ) : (
                  <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
                    {roster.results.map((student) => (
                      <li key={student.id}>
                        <label className="flex items-center gap-2 rounded px-1.5 py-1 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg-subtle)]">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.has(student.id)}
                            onChange={() => toggleStudent(student.id)}
                          />
                          {student.full_name}
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-[var(--color-text-muted)]">
                  {selectedStudentIds.size} student{selectedStudentIds.size === 1 ? "" : "s"} selected — each
                  gets an invite (in-app + email) as soon as the session is scheduled.
                </p>
              </div>
            )}

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate("/live-sessions")}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createSession.isPending || invitingIndex !== null}>
                {!createSession.isPending && invitingIndex === null && <Save className="size-4" aria-hidden="true" />}
                {invitingIndex !== null ? `Inviting student ${invitingIndex + 1} of ${selectedStudentIds.size}…` : "Schedule"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
