import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { BackgroundDecorations } from "@/features/auth/components/BackgroundDecorations";

import { Footer } from "./Footer";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--color-bg-subtle)]">
      <BackgroundDecorations />
      <ThemeToggle className="absolute right-4 top-4 z-20" />
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:p-6">
        <Suspense fallback={<FullPageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
