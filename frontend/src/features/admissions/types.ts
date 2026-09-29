export type ApplicationKind = "student" | "staff";

export type ApplicationStatus =
  | "submitted"
  | "shortlisted"
  | "interview_scheduled"
  | "accepted"
  | "rejected";

export interface ApplicationDocument {
  id: string;
  title: string;
  file: string;
  created_at: string;
}

export interface Application {
  id: string;
  kind: ApplicationKind;
  status: ApplicationStatus;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  gender: string;
  address: string;
  applying_for_class: string | null;
  applying_for_class_name: string | null;
  previous_school: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  applying_for_role: string | null;
  applying_for_role_name: string | null;
  job_title: string;
  qualification: string;
  years_of_experience: number | null;
  interview_datetime: string | null;
  interview_location: string;
  interview_notes: string;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  decided_at: string | null;
  rejection_reason: string;
  created_student: string | null;
  created_staff: string | null;
  documents: ApplicationDocument[];
  created_at: string;
  updated_at: string;
}

export interface ApplicationListParams {
  kind?: ApplicationKind;
  status?: ApplicationStatus;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface InviteInterviewPayload {
  application_ids: string[];
  interview_datetime: string;
  interview_location?: string;
  interview_notes?: string;
}

export interface BulkAcceptSkip {
  id: string;
  name: string;
  reason: string;
}

export interface BulkAcceptResult {
  accepted: number;
  skipped: BulkAcceptSkip[];
}

export interface PublicSchoolClassOption {
  id: string;
  name: string;
}

export interface PublicRoleOption {
  id: string;
  name: string;
}

export interface PublicApplicationOptions {
  classes: PublicSchoolClassOption[];
  roles: PublicRoleOption[];
}

export interface PublicApplicationPayload {
  kind: ApplicationKind;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  applying_for_class?: string;
  previous_school?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  applying_for_role?: string;
  job_title?: string;
  qualification?: string;
  years_of_experience?: number;
  documents?: File[];
}
