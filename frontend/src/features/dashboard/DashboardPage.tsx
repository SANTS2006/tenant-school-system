import { motion } from "framer-motion";
import { Boxes, CalendarCheck2, ClipboardList, GraduationCap, Users, Wallet } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useCurrentUser, useHasPermission, userHasPermission } from "@/features/auth/useAuth";
import { useAttendanceReport, useEnrollmentReport, useFinanceReport } from "@/features/reports/useReportsCrud";
import type { ApiError } from "@/lib/api-client";

import { AttendanceByStatusChart, EnrollmentByClassChart, EnrollmentStatusPieChart, FinanceByStatusChart } from "./charts/DashboardCharts";
import { ModuleSummaryCard } from "./ModuleSummaryCard";
import { MODULE_SUMMARY_CONFIG } from "./moduleSummaryConfig";
import { StatCard, type StatTone } from "./StatCard";
import { useDashboardOverview } from "./useDashboard";

function attendanceTone(rate: number | null): StatTone {
  if (rate === null) return "neutral";
  if (rate >= 90) return "success";
  if (rate >= 75) return "warning";
  return "danger";
}

function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardOverview();
  const { data: currentUser } = useCurrentUser();

  const canViewReports = useHasPermission("reports.view");
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const { data: enrollment } = useEnrollmentReport({ enabled: canViewReports });
  const { data: attendance } = useAttendanceReport(
    { start_date: monthStart, end_date: today },
    { enabled: canViewReports },
  );
  const { data: finance } = useFinanceReport(undefined, { enabled: canViewReports });

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError || !data) {
    return <Alert tone="danger">{(error as ApiError)?.message ?? "Failed to load the dashboard."}</Alert>;
  }

  // The exact same source of truth that drives sidebar visibility (AppShell.tsx's NAV_CONFIG +
  // userHasPermission), so this grid can never drift out of sync with what the sidebar shows.
  const availableModuleCards = MODULE_SUMMARY_CONFIG.filter((item) => userHasPermission(currentUser, item.permission));

  // Each headline stat is only included when the backend actually sent it — it omits a field
  // entirely rather than sending it to everyone, since `DashboardOverviewView` no longer
  // requires `reports.view` and now gates each number by its own domain `.view` permission.
  const stats: Array<{ key: string; icon: typeof GraduationCap; label: string; value: React.ReactNode; tone?: StatTone; footnote?: string }> = [];
  if (data.active_students !== undefined) {
    stats.push({ key: "students", icon: GraduationCap, label: "Active students", value: data.active_students });
  }
  if (data.active_staff !== undefined) {
    stats.push({ key: "staff", icon: Users, label: "Active staff", value: data.active_staff });
  }
  if (data.todays_attendance_rate_percent !== undefined) {
    stats.push({
      key: "attendance",
      icon: CalendarCheck2,
      label: "Today's attendance",
      value: data.todays_attendance_rate_percent === null ? "No data" : `${data.todays_attendance_rate_percent}%`,
      tone: attendanceTone(data.todays_attendance_rate_percent ?? null),
      footnote: "Daily records, today",
    });
  }
  if (data.outstanding_fees !== undefined) {
    stats.push({
      key: "fees",
      icon: Wallet,
      label: "Outstanding fees",
      value: formatCurrency(data.outstanding_fees),
      tone: data.outstanding_fees > 0 ? "warning" : "neutral",
    });
  }
  if (data.low_stock_items !== undefined) {
    stats.push({
      key: "stock",
      icon: Boxes,
      label: "Low-stock items",
      value: data.low_stock_items,
      tone: data.low_stock_items > 0 ? "danger" : "success",
      footnote: data.low_stock_items > 0 ? "Need reordering" : "All items healthy",
    });
  }
  if (data.pending_purchase_requests !== undefined) {
    stats.push({
      key: "purchases",
      icon: ClipboardList,
      label: "Pending purchase requests",
      value: data.pending_purchase_requests,
      tone: data.pending_purchase_requests > 0 ? "warning" : "neutral",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">A snapshot of your school right now.</p>
      </div>

      {stats.length > 0 && (
        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {stats.map(({ key, ...statProps }) => (
            <motion.div key={key} variants={cardVariants}>
              <StatCard {...statProps} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {data.low_stock_items !== undefined && data.low_stock_items > 0 && (
        <Alert tone="warning">
          {data.low_stock_items} inventory item{data.low_stock_items === 1 ? "" : "s"} at or below reorder level.
        </Alert>
      )}

      {canViewReports && (enrollment || attendance || finance) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {enrollment && <EnrollmentByClassChart report={enrollment} />}
          {enrollment && <EnrollmentStatusPieChart report={enrollment} />}
          {attendance && <AttendanceByStatusChart report={attendance} />}
          {finance && <FinanceByStatusChart report={finance} />}
        </div>
      )}

      {availableModuleCards.length > 0 && (
        <ScrollReveal>
          <div>
            <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">Your modules</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {availableModuleCards.map((config) => (
                <ModuleSummaryCard key={config.key} config={config} />
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
