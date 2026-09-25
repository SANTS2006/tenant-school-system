import { Navigate } from "react-router-dom";

import { useHasPermission } from "@/features/auth/useAuth";

/** `/examinations` alone has no page of its own — send the visitor to the first tab they can
 * actually see (a registrar has `examinations.view` but no `results.*` at all, so "Exams" is
 * the right landing tab for them, not "Enter marks"). */
export function ExaminationsIndexRedirect() {
  const canViewConfig = useHasPermission("examinations.view");
  const canViewResults = useHasPermission("results.view");

  if (canViewConfig) return <Navigate to="exams" replace />;
  if (canViewResults) return <Navigate to="enter-marks" replace />;
  return <Navigate to="exams" replace />;
}
