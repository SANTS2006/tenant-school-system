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

import type { ApplicationKind, CustomFieldConfig, FormFieldConfig, PublicApplicationOptions } from "./types";
import { usePublicApplicationOptions, useSubmitPublicApplication } from "./useAdmissionsCrud";

/** Wide controls take a whole row; the rest sit two to a row. */
const FULL_WIDTH_TYPES = new Set(["textarea", "files"]);

type Errors = Record<string, string>;

export function PublicApplyPage() {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const { data: school, isLoading: isLoadingSchool, isError: schoolNotFound } = useSchoolBranding(schoolSlug);
  const { data: options } = usePublicApplicationOptions(schoolSlug);
  const submitApplication = useSubmitPublicApplication();

  const [kind, setKind] = useState<ApplicationKind>("student");
  // One bag of answers keyed by field key — standard questions and the school's own extra ones alike.
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);

  const form = options?.form[kind];
  const set = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  };

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

  const switchKind = (next: ApplicationKind) => {
    setKind(next);
    setErrors({});
    setGeneralError(null);
  };

  const validate = (): Errors => {
    const found: Errors = {};
    for (const field of form?.fields ?? []) {
      if (!field.enabled || !field.required) continue;
      const missing = field.type === "files" ? files.length === 0 : !(values[field.key] ?? "").trim();
      if (missing) found[field.key] = "This field is required.";
    }
    for (const question of form?.custom_fields ?? []) {
      if (question.required && !(values[question.key as string] ?? "").trim()) {
        found[question.key as string] = "This question is required.";
      }
    }
    return found;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setGeneralError("Please complete the highlighted questions.");
      return;
    }
    setProgress(0);

    const customAnswers: Record<string, string> = {};
    for (const question of form?.custom_fields ?? []) {
      const answer = (values[question.key as string] ?? "").trim();
      if (answer) customAnswers[question.key as string] = answer;
    }
    const standard: Record<string, string | number | undefined> = {};
    for (const field of form?.fields ?? []) {
      if (!field.enabled || field.type === "files") continue;
      const raw = (values[field.key] ?? "").trim();
      standard[field.key] = field.type === "number" ? (raw ? Number(raw) : undefined) : raw || undefined;
    }

    submitApplication.mutate(
      {
        schoolSlug,
        values: {
          kind,
          first_name: standard.first_name as string,
          last_name: standard.last_name as string,
          email: standard.email as string,
          ...standard,
          custom_answers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
          documents: form?.fields.some((f) => f.key === "documents" && f.enabled) ? files : [],
        },
        onProgress: setProgress,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: (err: ApiError) => {
          const fieldErrors: Errors = {};
          for (const item of err.errors ?? []) {
            if (item.field) fieldErrors[item.field] = item.message;
          }
          setErrors(fieldErrors);
          setGeneralError(
            Object.keys(fieldErrors).length > 0 ? "Please fix the highlighted questions." : (err.errors[0]?.message ?? err.message),
          );
          setProgress(null);
        },
      },
    );
  };

  const renderStandard = (field: FormFieldConfig, opts: PublicApplicationOptions | undefined) => {
    const common = { label: field.label, required: field.required, error: errors[field.key] || undefined };
    const value = values[field.key] ?? "";
    switch (field.type) {
      case "textarea":
        return <Textarea {...common} rows={2} value={value} onChange={(e) => set(field.key, e.target.value)} />;
      case "gender":
        return (
          <Select {...common} value={value} onChange={(e) => set(field.key, e.target.value)}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        );
      case "class":
        return (
          <Select {...common} value={value} onChange={(e) => set(field.key, e.target.value)}>
            <option value="">Select a class</option>
            {opts?.classes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        );
      case "role":
        return (
          <Select {...common} value={value} onChange={(e) => set(field.key, e.target.value)}>
            <option value="">Select a role</option>
            {opts?.roles.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        );
      case "files":
        return (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-[var(--color-text)]">
              {field.label}
              {field.required && <span className="text-[var(--color-danger)]"> *</span>}
            </span>
            <input
              type="file"
              multiple
              onChange={(e) => {
                setFiles(e.target.files ? Array.from(e.target.files) : []);
                setErrors((prev) => (prev[field.key] ? { ...prev, [field.key]: "" } : prev));
              }}
              className="text-sm text-[var(--color-text-muted)] file:mr-3 file:rounded-[var(--radius-md)] file:border-0 file:bg-[var(--color-bg-subtle)] file:px-3 file:py-1.5 file:text-sm file:text-[var(--color-text)]"
            />
            {files.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Paperclip className="size-3.5" aria-hidden="true" />
                {files.length} file(s) selected
              </p>
            )}
            {errors[field.key] && <p className="text-xs text-[var(--color-danger)]">{errors[field.key]}</p>}
          </div>
        );
      default:
        return (
          <Input
            {...common}
            type={field.type === "number" ? "number" : field.type}
            min={field.type === "number" ? 0 : undefined}
            value={value}
            onChange={(e) => set(field.key, e.target.value)}
          />
        );
    }
  };

  const renderCustom = (question: CustomFieldConfig) => {
    const key = question.key as string;
    const common = { label: question.label, required: question.required, error: errors[key] || undefined };
    const value = values[key] ?? "";
    if (question.type === "textarea") {
      return <Textarea {...common} rows={3} value={value} onChange={(e) => set(key, e.target.value)} />;
    }
    if (question.type === "select") {
      return (
        <Select {...common} value={value} onChange={(e) => set(key, e.target.value)}>
          <option value="">Select…</option>
          {question.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      );
    }
    return (
      <Input
        {...common}
        type={question.type === "number" || question.type === "date" ? question.type : "text"}
        value={value}
        onChange={(e) => set(key, e.target.value)}
      />
    );
  };

  const enabledFields = form?.fields.filter((field) => field.enabled) ?? [];

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
                onClick={() => switchKind(option)}
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

          {!form ? (
            <FullPageSpinner />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {enabledFields.map((field) => (
                  <div key={field.key} className={FULL_WIDTH_TYPES.has(field.type) ? "sm:col-span-2" : undefined}>
                    {renderStandard(field, options)}
                  </div>
                ))}
                {form.custom_fields.map((question) => (
                  <div
                    key={question.key}
                    className={question.type === "textarea" ? "sm:col-span-2" : undefined}
                  >
                    {renderCustom(question)}
                  </div>
                ))}
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
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
