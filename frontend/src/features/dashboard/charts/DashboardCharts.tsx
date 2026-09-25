import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AttendanceReport, EnrollmentReport, FinanceReport } from "@/features/reports/types";

import { ChartCard } from "./ChartCard";
import { PIE_COLORS, statusLabel, TOOLTIP_STYLE } from "./chartTheme";

export function EnrollmentByClassChart({ report }: { report: EnrollmentReport }) {
  const data = report.by_class.map((row) => ({
    name: row.current_class__name ?? "Unassigned",
    count: row.count,
  }));

  return (
    <ChartCard title="Enrollment by class" subtitle={`${report.total_students} students total`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function EnrollmentStatusPieChart({ report }: { report: EnrollmentReport }) {
  const data = report.by_status.map((row) => ({ name: statusLabel(row.status), value: row.count }));

  return (
    <ChartCard title="Enrollment by status">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AttendanceByStatusChart({ report }: { report: AttendanceReport }) {
  const data = report.by_status.map((row) => ({ name: statusLabel(row.status), count: row.count }));

  return (
    <ChartCard
      title="Attendance this month"
      subtitle={report.attendance_rate_percent === null ? "No data yet" : `${report.attendance_rate_percent}% present`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function FinanceByStatusChart({ report }: { report: FinanceReport }) {
  const data = report.by_status.map((row) => ({ name: statusLabel(row.status), count: row.count }));

  return (
    <ChartCard title="Invoices by status">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="count" fill="var(--color-success)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
