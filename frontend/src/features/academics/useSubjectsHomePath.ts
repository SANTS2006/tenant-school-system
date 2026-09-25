import { useCurrentUser } from "@/features/auth/useAuth";

/** Where "back" goes from a subject's roster / CA / results / communications pages: teachers land on
 * their own Subjects cards, administrators on the full Subject Offerings table. */
export function useSubjectsHomePath(): string {
  const { data: user } = useCurrentUser();
  return user?.roles.some((role) => role.slug === "teacher") ? "/subjects" : "/academics/subject-offerings";
}
