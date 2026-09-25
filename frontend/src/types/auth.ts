export interface SchoolSummary {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface RoleSummary {
  id: string;
  name: string;
  slug: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  photo: string | null;
  user_type: string;
  is_platform_admin: boolean;
  is_email_verified: boolean;
  is_online: boolean;
  school: SchoolSummary | null;
  permissions: string[];
  roles: RoleSummary[];
  is_student: boolean;
  is_staff_member: boolean;
  two_factor_enabled: boolean;
  two_factor_required: boolean;
  must_change_password: boolean;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  photo?: File;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}
