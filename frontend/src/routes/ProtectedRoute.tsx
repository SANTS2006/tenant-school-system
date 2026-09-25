import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useCurrentUser, useHeartbeat, useLogout } from "@/features/auth/useAuth";
import { useIdleLogout } from "@/hooks/useIdleLogout";

export function ProtectedRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user, isLoading, isError } = useCurrentUser();
  const logout = useLogout();

  // Only once there's a real authenticated session — an anonymous visitor bouncing off
  // /login has no session for the backend to attach a heartbeat to.
  useHeartbeat(!!user);

  // Shared school computers: end an abandoned session instead of leaving it open for the next person.
  const { secondsLeft, stayActive } = useIdleLogout(!!user, () => {
    logout.mutate(undefined, {
      onSettled: () => navigate("/login", { replace: true, state: { reason: "idle" } }),
    });
  });

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <>
      <Outlet />
      {secondsLeft !== null && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="idle-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-md)]">
            <h2 id="idle-title" className="text-base font-semibold text-[var(--color-text)]">
              Still there?
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              For your security you'll be signed out in <strong>{secondsLeft}</strong> second
              {secondsLeft === 1 ? "" : "s"} because there's been no activity.
            </p>
            <div className="mt-5 flex justify-end">
              <Button onClick={stayActive} autoFocus>
                Stay signed in
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
