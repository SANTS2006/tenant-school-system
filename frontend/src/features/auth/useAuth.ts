import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { ApiError } from "@/lib/api-client";
import type { ChangePasswordPayload, CurrentUser, UpdateProfilePayload } from "@/types/auth";

import {
  beginTwoFactorSetup,
  changePassword,
  confirmTwoFactorSetup,
  disableTwoFactor,
  enableTwoFactor,
  enrollTwoFactor,
  fetchCurrentUser,
  fetchTwoFactorStatus,
  login,
  logout,
  regenerateRecoveryCodes,
  sendHeartbeat,
  updateCurrentUser,
  verifyTwoFactor,
  type LoginResult,
  type TwoFactorEnrollment,
  type TwoFactorStatus,
} from "./api";

export const CURRENT_USER_QUERY_KEY = ["auth", "me"] as const;

const HEARTBEAT_INTERVAL_MS = 60_000;

export function useCurrentUser() {
  return useQuery<CurrentUser, ApiError>({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
  });
}

/** Pings the backend roughly once a minute so `User.last_seen_at` (and therefore the presence
 * dot everyone sees on this user's `Avatar`) stays fresh while the app is open. Mounted once in
 * `ProtectedRoute`, gated by `enabled` so an anonymous visitor (still loading `/auth/me/`, or
 * bounced to /login) never sends one. Errors are swallowed: a missed heartbeat should never
 * surface as a user-facing failure, it just lets the dot go stale. */
export function useHeartbeat(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const ping = () => {
      sendHeartbeat().catch(() => {});
    };
    ping();
    const interval = setInterval(ping, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled]);
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation<LoginResult, ApiError, { email: string; password: string }>({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: (result) => {
      // A two-factor challenge is NOT a session: nothing to cache until the second step succeeds.
      if (result.kind === "signed-in") {
        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, result.user);
      }
    },
  });
}

export function useVerifyTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation<CurrentUser, ApiError, { token: string; code: string }>({
    mutationFn: ({ token, code }) => verifyTwoFactor(token, code),
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
  });
}

export function useBeginTwoFactorSetup() {
  return useMutation<TwoFactorEnrollment, ApiError, string>({ mutationFn: beginTwoFactorSetup });
}

export function useConfirmTwoFactorSetup() {
  const queryClient = useQueryClient();
  return useMutation<{ recovery_codes: string[] }, ApiError, { token: string; code: string }>({
    mutationFn: async ({ token, code }) => {
      const result = await confirmTwoFactorSetup(token, code);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, result.user);
      return { recovery_codes: result.recovery_codes };
    },
  });
}

const TWO_FACTOR_STATUS_KEY = ["auth", "2fa-status"] as const;

export function useTwoFactorStatus() {
  return useQuery<TwoFactorStatus, ApiError>({ queryKey: TWO_FACTOR_STATUS_KEY, queryFn: fetchTwoFactorStatus });
}

export function useEnrollTwoFactor() {
  return useMutation<TwoFactorEnrollment, ApiError, string>({ mutationFn: enrollTwoFactor });
}

export function useEnableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation<string[], ApiError, string>({
    mutationFn: enableTwoFactor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TWO_FACTOR_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { password: string; code: string }>({
    mutationFn: ({ password, code }) => disableTwoFactor(password, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TWO_FACTOR_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    },
  });
}

export function useRegenerateRecoveryCodes() {
  const queryClient = useQueryClient();
  return useMutation<string[], ApiError, { password: string; code: string }>({
    mutationFn: ({ password, code }) => regenerateRecoveryCodes(password, code),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TWO_FACTOR_STATUS_KEY }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError>({
    mutationFn: logout,
    onSettled: () => {
      // Clear everything, not just the user — every cached query belongs to the
      // session that just ended, and the next user (or an anonymous visitor)
      // must never see stale data left over from it.
      queryClient.clear();
    },
  });
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  return useMutation<CurrentUser, ApiError, UpdateProfilePayload>({
    mutationFn: updateCurrentUser,
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_QUERY_KEY, user),
  });
}

/** Deliberately doesn't touch the query cache on success — the backend blacklists every
 * outstanding refresh token for this user, so the only correct follow-up is to log out and
 * redirect to /login (the component calling this handles that with useLogout + navigate). */
export function useChangePassword() {
  return useMutation<void, ApiError, ChangePasswordPayload>({
    mutationFn: changePassword,
  });
}

/** Plain (non-hook) check, reusable anywhere a `CurrentUser` is already in hand — e.g.
 * filtering a fixed list of nav items without calling a hook once per item. An array of codes
 * means "any of" — e.g. an Attendance nav item visible to someone with either `attendance.view`
 * or `staff_attendance.view`, since those are two genuinely separate permission sets. */
export function userHasPermission(user: CurrentUser | undefined, code?: string | string[]): boolean {
  if (!code || (Array.isArray(code) && code.length === 0)) return true;
  const codes = Array.isArray(code) ? code : [code];
  return !!user && (user.is_platform_admin || codes.some((c) => user.permissions.includes(c)));
}

export function useHasPermission(code: string | string[]): boolean {
  const { data: user } = useCurrentUser();
  return userHasPermission(user, code);
}

/** Layers a self-service identity check on top of `userHasPermission` — some nav items (My
 * Transcript, My Lessons, etc.) are meant only for student portal accounts, which hold zero RBAC
 * permissions and so can't be gated by a permission code at all (see `is_student` on
 * `CurrentUser` / `CurrentUserSerializer.get_is_student` for why). A plain `permission` item with
 * no `selfServiceFor` behaves exactly like `userHasPermission` always did. */
export function isNavItemVisible(
  user: CurrentUser | undefined,
  item: {
    permission?: string | string[];
    selfServiceFor?: "student" | "student-or-staff";
    /** Role slugs that never see this item, even if they hold its permission (e.g. the Teacher
     * keeps `academics.view` for the subject-roster API but has no Academics sidebar module). */
    hideForRoles?: string[];
    /** When set, only accounts holding one of these role slugs see the item. */
    showForRoles?: string[];
  },
): boolean {
  const roleSlugs = user?.roles?.map((role) => role.slug) ?? [];
  if (item.hideForRoles?.some((slug) => roleSlugs.includes(slug))) return false;
  if (item.showForRoles && !item.showForRoles.some((slug) => roleSlugs.includes(slug))) return false;
  if (!userHasPermission(user, item.permission)) return false;
  if (item.selfServiceFor === "student" && !user?.is_student) return false;
  if (item.selfServiceFor === "student-or-staff" && !(user?.is_student || user?.is_staff_member)) return false;
  return true;
}
