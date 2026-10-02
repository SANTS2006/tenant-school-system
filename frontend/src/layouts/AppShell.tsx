import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, School, X } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { isNavItemVisible, useActiveRole, useCurrentUser } from "@/features/auth/useAuth";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { useActingSchool } from "@/hooks/useActingSchool";
import { clearActingSchool } from "@/lib/actingSchool";
import { cn } from "@/lib/cn";

import { Footer } from "./Footer";
import { NAV_CONFIG, type NavItem } from "./navConfig";
import { UserMenu } from "./UserMenu";

export function LogoBadge({ className, logoUrl }: { className?: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <span className={cn("flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg", className)}>
        <img src={logoUrl} alt="" className="size-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-white",
        className,
      )}
    >
      <School className="size-4" aria-hidden="true" />
    </span>
  );
}

function SidebarContent({
  schoolName,
  schoolLogo,
  navItems,
  onNavigate,
}: {
  schoolName: string;
  schoolLogo?: string | null;
  navItems: NavItem[];
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        navItems
          .filter((item) => item.children && item.children.length > 0 && location.pathname.startsWith(item.to))
          .map((item) => item.to),
      ),
  );

  useEffect(() => {
    const activeParent = navItems.find(
      (item) => item.children && item.children.length > 0 && location.pathname.startsWith(item.to),
    );
    if (activeParent && !expanded.has(activeParent.to)) {
      setExpanded((prev) => new Set(prev).add(activeParent.to));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navItems]);

  const toggle = (to: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(to)) {
        next.delete(to);
      } else {
        next.add(to);
      }
      return next;
    });
  };

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <LogoBadge logoUrl={schoolLogo} />
        <span className="truncate text-sm font-semibold tracking-tight text-white">{schoolName}</span>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3 [scrollbar-color:rgba(255,255,255,0.18)_transparent]">
        {navItems.map(({ to, label, icon: Icon, children }) => {
          if (!children || children.length === 0) {
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[image:var(--gradient-primary)] text-white shadow-[0_8px_20px_-8px_rgba(99,102,241,0.9)]"
                      : "text-indigo-100/70 hover:bg-white/8 hover:text-white",
                  )
                }
              >
                <Icon className="size-[1.1rem]" aria-hidden="true" />
                {label}
              </NavLink>
            );
          }

          const isOpen = expanded.has(to);
          const isModuleActive = location.pathname.startsWith(to);

          return (
            <div key={to} className="flex flex-col">
              <button
                type="button"
                onClick={() => toggle(to)}
                aria-expanded={isOpen}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isModuleActive
                    ? "bg-white/10 text-white"
                    : "text-indigo-100/70 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon className="size-[1.1rem] shrink-0" aria-hidden="true" />
                <span className="flex-1 text-left">{label}</span>
                <ChevronDown
                  className={cn("size-3.5 shrink-0 transition-transform duration-200", !isOpen && "-rotate-90")}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 flex flex-col gap-0.5 border-l border-white/15 py-1 pl-3">
                      {children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn(
                              "rounded-[var(--radius-md)] px-3 py-1.5 text-sm transition-colors duration-200",
                              isActive
                                ? "bg-white/12 font-semibold text-white"
                                : "text-indigo-100/60 hover:bg-white/8 hover:text-white",
                            )
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>
    </>
  );
}

export function AppShell() {
  const { data: user } = useCurrentUser();
  const { activeRole } = useActiveRole();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const actingSchool = useActingSchool();
  const navigate = useNavigate();

  // Platform admins have no school and no school-scoped Role/permissions of their own — every
  // permission check in this backend short-circuits true for them, and school-scoped querysets
  // either come back empty or (worse) entirely unscoped across every tenant, so they must never
  // land on any page in this shell. PlatformShell is their only home — *unless* they've
  // deliberately entered "view this school's data" mode (see SchoolDetailPage's "View school
  // data" button and lib/actingSchool.ts), in which case this shell renders normally against
  // that one school, exactly like it would for a real user of that school. See PlatformShell's
  // mirror guard for the reverse case.
  if (user?.is_platform_admin && !actingSchool) {
    return <Navigate to="/platform" replace />;
  }

  const schoolName = actingSchool?.name ?? user?.school?.name ?? "NTS School System";
  const schoolLogo = user?.school?.logo;
  const navItems = NAV_CONFIG.filter((item) => isNavItemVisible(user, item, activeRole)).map((item) => ({
    ...item,
    children: item.children?.filter((child) => isNavItemVisible(user, child, activeRole)),
  }));

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-subtle)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-[image:var(--gradient-sidebar)] lg:sticky lg:top-0 lg:flex lg:h-screen">
        <SidebarContent schoolName={schoolName} schoolLogo={schoolLogo} navItems={navItems} />
      </aside>

      {/* Mobile off-canvas drawer */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-[#0b0d1a]/55 backdrop-blur-sm"
              onClick={() => setIsMobileNavOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.aside
              className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[image:var(--gradient-sidebar)] shadow-[var(--shadow-md)]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setIsMobileNavOpen(false)}
                className="absolute right-3 top-4 rounded-full p-1.5 text-indigo-100/70 transition-colors duration-200 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
              <SidebarContent
                schoolName={schoolName}
                schoolLogo={schoolLogo}
                navItems={navItems}
                onNavigate={() => setIsMobileNavOpen(false)}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {user?.is_platform_admin && actingSchool && (
          <div className="flex shrink-0 items-center justify-between gap-3 bg-[image:var(--gradient-primary)] px-4 py-1.5 text-xs font-medium text-white sm:px-6">
            <span>
              Viewing <strong>{actingSchool.name}</strong> as platform admin
            </span>
            <button
              type="button"
              onClick={() => {
                clearActingSchool();
                navigate("/platform");
              }}
              className="rounded px-2 py-0.5 underline-offset-2"
            >
              Exit
            </button>
          </div>
        )}
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setIsMobileNavOpen(true)}
            className="rounded-[var(--radius-md)] p-1.5 text-[var(--color-text-muted)] transition-colors duration-200 hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)] lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <LogoBadge logoUrl={schoolLogo} />
            <span className="truncate text-sm font-semibold text-[var(--color-text)]">{schoolName}</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
            <ThemeToggle />
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg-subtle)] p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
          <Suspense fallback={<FullPageSpinner />}>
            <Outlet />
          </Suspense>
          </div>
        </main>
        <Footer schoolName={user?.school?.name} />
      </div>
    </div>
  );
}
