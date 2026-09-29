import { CheckCircle2, Paperclip, School as SchoolIcon, Upload } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { useSchoolBranding } from "@/features/schools/useSchoolsCrud";
import type { ApiError } from "@/lib/api-client";

import type { ApplicationKind } from "./types";
import { usePublicApplicationOptions, useSubmitPublicApplication } from "./useAdmissionsCrud";

const EMPTY_FORM = {
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  address: "",
  applying_for_class: "",
  previous_school: "",
  guardian_name: "",
  guardian_phone: "",
  guardian_email: "",
  applying_for_role: "",
  job_title: "",
  qualification: "",
  years_of_experience: "",
};

export function PublicApplyPage() {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const { data: school, isLoading: isLoadingSchool, isError: schoolNotFound } = useSchoolBranding(schoolSlug);
  const { data: options } = usePublicApplicationOptions(schoolSlug);
  const submitApplication = useSubmitPublicApplication();

  const [kind, setKind] = useState<ApplicationKind>("student");
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (isLoadingSchool) {
    return <FullPageSpinner />;
  }

  if (schoolNotFound || !school || !schoolSlug) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <SchoolIcon className="size-8 text-[var(--color-text-muted)]" aria-hidden="true" />
          <p className="text-sm text-[var(--color-text)]">We couldn't find that school.</p>
        </CardContent>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-10 text-[var(--color-success)]" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-[var(--color-text)]">Application submitted</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Thank you for applying to {school.name}. We'll be in touch by email with next steps.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setProgress(0);

    submitApplication.mutate(
      {
        schoolSlug,
        values: {
          kind,
          first_name: form.first_name,
          middle_name: form.middle_name || undefined,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone || undefined,
          date_of_birth: form.date_of_birth || undefined,
          gender: form.gender || undefined,
          address: form.address || undefined,
          ...(kind === "student"
            ? {
                applying_for_class: form.applying_for_class || undefined,
                previous_school: form.previous_school || undefined,
                guardian_name: form.guardian_name || undefined,
                guardian_phone: form.guardian_phone || undefined,
                guardian_email: form.guardian_email || undefined,
              }
            : {
                applying_for_role: form.applying_for_role || undefined,
                job_title: form.job_title || undefined,
                qualification: form.qualification || undefined,
                years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : undefined,
              }),
          documents: files,
        },
        onProgress: setProgress,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: ApiError) => {
          setGeneralError(err.errors[0]?.message ?? err.message);
          setProgress(null);
        },
      },
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          {school.logo ? (
            <img src={school.logo} alt="" className="size-10 rounded-[var(--radius-md)] object-cover" />
          ) : (
            <SchoolIcon className="size-8 text-[var(--color-primary)]" aria-hidden="true" />
          )}
          <div>
            <CardTitle>Apply to {school.name}</CardTitle>
            <p className="text-sm text-[var(--color-text-muted)]">Submit your application below.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {generalError && (
          <Alert tone="danger" className="mb-4">
            {generalError}
          </Alert>
        )}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex gap-2">
            {(["student", "staff"] as ApplicationKind[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setKind(option)}
                className={`flex-1 rounded-[var(--radius-md)] border px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  kind === option
                    ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {option} applicant
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input label="First name" required value={form.first_name} onChange={set("first_name")} />
            <Input label="Middle name" value={form.middle_name} onChange={set("middle_name")} />
            <Input label="Last name" required value={form.last_name} onChange={set("last_name")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input type="email" label="Email" required value={form.email} onChange={set("email")} />
            <Input label="Phone" value={form.phone} onChange={set("phone")} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input type="date" label="Date of birth" value={form.date_of_birth} onChange={set("date_of_birth")} />
            <Select label="Gender" value={form.gender} onChange={set("gender")}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <Textarea label="Address" rows={2} value={form.address} onChange={set("address")} />

          {kind === "student" ? (
            <>
              <Select
                label="Applying for class"
                required
                value={form.applying_for_class}
                onChange={set("applying_for_class")}
              >
                <option value="">Select a class</option>
                {options?.classes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
              <Input label="Previous school" value={form.previous_school} onChange={set("previous_school")} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input label="Guardian name" value={form.guardian_name} onChange={set("guardian_name")} />
                <Input label="Guardian phone" value={form.guardian_phone} onChange={set("guardian_phone")} />
                <Input
                  type="email"
                  label="Guardian email"
                  value={form.guardian_email}
                  onChange={set("guardian_email")}
                />
              </div>
            </>
          ) : (
            <>
              <Select
                label="Applying for role"
                required
                value={form.applying_for_role}
                onChange={set("applying_for_role")}
              >
                <option value="">Select a role</option>
                {options?.roles.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </Select>
              <Input label="Job title" value={form.job_title} onChange={set("job_title")} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Qualification" value={form.qualification} onChange={set("qualification")} />
                <Input
                  type="number"
                  min={0}
                  label="Years of experience"
                  value={form.years_of_experience}
                  onChange={set("years_of_experience")}
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">Supporting documents</span>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
              className="text-sm text-[var(--color-text-muted)] file:mr-3 file:rounded-[var(--radius-md)] file:border-0 file:bg-[var(--color-bg-subtle)] file:px-3 file:py-1.5 file:text-sm file:text-[var(--color-text)]"
            />
            {files.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Paperclip className="size-3.5" aria-hidden="true" />
                {files.length} file(s) selected
              </p>
            )}
          </div>

          {progress !== null && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
              <div
                className="h-full rounded-full bg-[image:var(--gradient-primary)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="mt-2 flex justify-end">
            <Button type="submit" isLoading={submitApplication.isPending}>
              {!submitApplication.isPending && <Upload className="size-4" aria-hidden="true" />}
              Submit application
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
