import { motion } from "framer-motion";
import { Ban, Clock, School as SchoolIcon, ShieldCheck, UserCheck, Users } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { StatCard, type StatTone } from "@/features/dashboard/StatCard";
import type { ApiError } from "@/lib/api-client";

import { usePlatformStats } from "./usePlatformCrud";

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function PlatformOverviewPage() {
  const { data, isLoading, isError, error } = usePlatformStats();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isError || !data) {
    return <Alert tone="danger">{(error as ApiError)?.message ?? "Failed to load platform stats."}</Alert>;
  }

  const stats: Array<{ key: string; icon: typeof SchoolIcon; label: string; value: number; tone?: StatTone }> = [
    { key: "total", icon: SchoolIcon, label: "Total schools", value: data.schools_total },
    { key: "active", icon: UserCheck, label: "Active schools", value: data.schools_by_status.active, tone: "success" },
    { key: "pending", icon: Clock, label: "Pending schools", value: data.schools_by_status.pending, tone: "warning" },
    { key: "suspended", icon: Ban, label: "Suspended schools", value: data.schools_by_status.suspended, tone: "danger" },
    { key: "users", icon: Users, label: "School users", value: data.school_users_total },
    { key: "admins", icon: ShieldCheck, label: "Platform admins", value: data.platform_admins_total },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Platform overview</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">A snapshot of every school on the platform.</p>
      </div>

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
    </div>
  );
}
