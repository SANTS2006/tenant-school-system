import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/toastContext";
import type { ApiError } from "@/lib/api-client";
import { generalErrorMessage } from "@/lib/formErrors";

import type { Assessment, AssessmentStatus } from "./types";
import { useCreateAssessment, useUpdateAssessment } from "./useAcademicsCrud";

interface FormState {
  name: string;
  weight: string;
  maxScore: string;
  discretionary: string;
  status: AssessmentStatus;
}

function initialState(assessment: Assessment | null): FormState {
  return assessment
    ? {
        name: assessment.name,
        weight: String(assessment.weight),
        maxScore: String(Number(assessment.max_score)),
        discretionary: assessment.discretionary_weight ? String(assessment.discretionary_weight) : "",
        status: assessment.status,
      }
    : { name: "", weight: "", maxScore: "100", discretionary: "", status: "active" };
}

/** Add a new assessment, or edit an existing one (name, weight, maximum score, marks held back for the
 * teacher's discretion, and active/inactive). Mount it with a `key` per assessment so each opens with
 * its own values. `availablePercent` is how much of the subject's CA weight is still unallocated. */
export function AssessmentFormModal({
  open,
  onClose,
  subjectOfferingId,
  assessment,
  availablePercent,
}: {
  open: boolean;
  onClose: () => void;
  subjectOfferingId: string;
  assessment: Assessment | null;
  availablePercent: number;
}) {
  const { showToast } = useToast();
  const isEdit = assessment !== null;
  const create = useCreateAssessment();
  const update = useUpdateAssessment(assessment?.id ?? "");
  const mutation = isEdit ? update : create;
  const [form, setForm] = useState<FormState>(() => initialState(assessment));
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  // Editing an active assessment frees its own weight first, so it can be raised up to what's left + itself.
  const ceiling = availablePercent + (isEdit && assessment.status === "active" ? assessment.weight : 0);
  const weight = Number(form.weight);
  const canSave = form.name.trim() !== "" && weight > 0 && Number(form.maxScore) > 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    mutation.mutate(
      {
        subject_offering: subjectOfferingId,
        name: form.name.trim(),
        weight,
        max_score: form.maxScore,
        discretionary_weight: form.discretionary ? Number(form.discretionary) : 0,
        ...(isEdit ? { status: form.status } : {}),
      },
      {
        onSuccess: () => {
          showToast({ title: isEdit ? "Assessment updated" : "Assessment added" });
          onClose();
        },
        onError: (err: ApiError) => setError(generalErrorMessage(err)),
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Edit "${assessment.name}"` : "Add an assessment"}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Input label="Name" placeholder="e.g. Assignment 1" value={form.name} maxLength={100} onChange={(e) => set("name", e.target.value)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Weight %"
            type="number"
            min={1}
            max={Math.max(ceiling, 1)}
            value={form.weight}
            onChange={(e) => set("weight", e.target.value)}
            hint={`Share of the subject's CA. Up to ${ceiling}% is still available.`}
          />
          <Input
            label="Max score"
            type="number"
            min={1}
            value={form.maxScore}
            onChange={(e) => set("maxScore", e.target.value)}
            hint="The score that counts as full marks."
          />
        </div>
        <Input
          label="Reserved for discretion"
          type="number"
          min={0}
          max={form.weight ? weight : undefined}
          value={form.discretionary}
          onChange={(e) => set("discretionary", e.target.value)}
          hint="Part of the weight you award by hand, per student, instead of from the test score."
        />
        {isEdit && (
          <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value as AssessmentStatus)}>
            <option value="active">Active — counts towards CA</option>
            <option value="inactive">Inactive — left out of CA</option>
          </Select>
        )}
        {isEdit && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Changing the weight, max score or reserved marks recalculates the scores already entered.
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave} isLoading={mutation.isPending}>
            {isEdit ? "Save changes" : "Add assessment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
