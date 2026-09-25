import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Save, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { useDepartmentList } from "@/features/academics/useAcademicsCrud";
import { useRoles } from "@/features/authorization/useRoles";
import { useInviteUser } from "@/features/users/useUsers";
import type { ApiError } from "@/lib/api-client";

import { useCreateStaff } from "./useStaffCrud";

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // matches the backend's validate_image_file cap
const ACCEPTED_PHOTO_TYPES = "image/jpeg,image/png,image/gif,image/webp";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role_id: z.string(),
  staff_id: z.string(),
  department: z.string(),
  job_title: z.string(),
  qualification: z.string(),
  hire_date: z.string(),
  emergency_contact_name: z.string(),
  emergency_contact_phone: z.string(),
});

type FormValues = z.infer<typeof schema>;

const EMPTY_VALUES: FormValues = {
  email: "",
  first_name: "",
  last_name: "",
  role_id: "",
  staff_id: "",
  department: "",
  job_title: "",
  qualification: "",
  hire_date: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

/** New hires don't have an account yet — there is no single backend endpoint that creates a
 * User and a Staff profile together, so this form makes two calls: invite the account, then
 * attach a Staff profile to whatever id comes back. See `docs/ARCHITECTURE.md` for why (the
 * backend deliberately disallows creating a `User` directly — accounts are always invited). */
export function StaffFormPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: departments } = useDepartmentList({ page_size: 100 });
  const { data: roles } = useRoles();
  const inviteUser = useInviteUser();
  const createStaff = useCreateStaff();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY_VALUES });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | undefined>();

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError(`Image exceeds the maximum allowed size of ${MAX_PHOTO_SIZE_BYTES / (1024 * 1024)}MB.`);
      return;
    }
    setPhotoError(undefined);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const isSubmitting = inviteUser.isPending || createStaff.isPending;

  const onSubmit = (values: FormValues) => {
    inviteUser.mutate(
      {
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        role_id: values.role_id || undefined,
      },
      {
        onSuccess: (invited) => {
          createStaff.mutate(
            {
              user: invited.id,
              staff_id: values.staff_id || undefined,
              department: values.department || undefined,
              job_title: values.job_title || undefined,
              qualification: values.qualification || undefined,
              hire_date: values.hire_date || undefined,
              emergency_contact_name: values.emergency_contact_name || undefined,
              emergency_contact_phone: values.emergency_contact_phone || undefined,
              photo: photoFile ?? undefined,
            },
            {
              onSuccess: (staff) => {
                showToast({ title: "Staff member added", description: `${staff.email} can sign in now with the school's default password.` });
                navigate(`/staff/${staff.id}`);
              },
              onError: (err: ApiError) => {
                showToast({
                  title: "Account created, but the staff profile could not be saved",
                  description: `${invited.email} was invited, but: ${err.message} Contact support to finish linking this account.`,
                  tone: "danger",
                });
              },
            },
          );
        },
        onError: (err: ApiError) => {
          showToast({ title: "Could not invite this person", description: err.message, tone: "danger" });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[var(--color-text)]">New staff member</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-[var(--color-text-muted)]">
            Creates a new login for this person, active immediately with the school's default
            password (its initials plus the current year, e.g. "DA@2026"). They can change it once
            signed in, and any admin can reset it back to this default later.
          </p>
          {(inviteUser.isError || createStaff.isError) && (
            <Alert tone="danger" className="mb-4">
              {((inviteUser.error ?? createStaff.error) as ApiError).message}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative size-24 shrink-0 overflow-hidden rounded-full border-2 border-[var(--color-border)] bg-[var(--color-bg-subtle)] transition-all duration-200 hover:border-[var(--color-primary)] hover:shadow-[0_8px_24px_-8px_color-mix(in_srgb,var(--color-primary)_60%,transparent)]"
                aria-label="Change staff photo"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="" className="size-full object-cover" />
                ) : (
                  <UserIcon className="mx-auto size-10 translate-y-4 text-[var(--color-text-muted)]" aria-hidden="true" />
                )}
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-transparent transition-all duration-200 group-hover:bg-black/40 group-hover:text-white">
                  <Camera className="size-6" aria-hidden="true" />
                </span>
              </button>
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-sm font-medium text-[var(--color-text)]">Photo</p>
                <p className="text-xs text-[var(--color-text-muted)]">JPG, PNG, GIF or WEBP, up to 5MB.</p>
                {photoError && <p className="text-xs text-[var(--color-danger)]">{photoError}</p>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_PHOTO_TYPES}
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="First name" error={errors.first_name?.message} {...register("first_name")} />
              <Input label="Last name" error={errors.last_name?.message} {...register("last_name")} />
            </div>
            <Input type="email" label="Email" error={errors.email?.message} {...register("email")} />
            <Select label="Role" hint="Determines what they can do once they accept the invitation." error={errors.role_id?.message} {...register("role_id")}>
              <option value="">No role assigned</option>
              {roles?.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </Select>

            <hr className="my-2 border-[var(--color-border)]" />

            <h2 className="text-sm font-medium text-[var(--color-text)]">Staff details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Staff ID" error={errors.staff_id?.message} {...register("staff_id")} />
              <Select label="Department" error={errors.department?.message} {...register("department")}>
                <option value="">Not set</option>
                {departments?.results.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Select>
              <Input label="Job title" error={errors.job_title?.message} {...register("job_title")} />
              <Input type="date" label="Hire date" error={errors.hire_date?.message} {...register("hire_date")} />
            </div>
            <Input label="Qualification" error={errors.qualification?.message} {...register("qualification")} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Emergency contact name"
                error={errors.emergency_contact_name?.message}
                {...register("emergency_contact_name")}
              />
              <Input
                label="Emergency contact phone"
                error={errors.emergency_contact_phone?.message}
                {...register("emergency_contact_phone")}
              />
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => navigate("/staff")}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {!isSubmitting && <Save className="size-4" aria-hidden="true" />}
                Invite &amp; save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
