import { Outlet } from "react-router-dom";

export function AcademicsLayout() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Academics</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Academic years, terms, departments, subjects, classes and sections.
        </p>
      </div>

      <Outlet />
    </div>
  );
}
