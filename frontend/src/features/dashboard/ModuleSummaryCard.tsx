import { Link } from "react-router-dom";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent } from "@/components/ui/Card";
import { useSummaryStats } from "@/hooks/useSummaryStats";

import { PIE_COLORS, statusLabel, TOOLTIP_STYLE } from "./charts/chartTheme";
import type { ModuleSummaryConfig } from "./moduleSummaryConfig";

/** One compact "at a glance" card per module, backed by that module's own `/summary/` endpoint.
 * Shows the module's headline number(s), plus a small pie breakdown when the module declares a
 * `breakdownKey` (a `groupby` result). Always links through to the module's own list page —
 * this is a richer replacement for what used to be a plain icon+label link card. */
export function ModuleSummaryCard({ config }: { config: ModuleSummaryConfig }) {
  const { data: stats, isLoading } = useSummaryStats(config.resource);
  const Icon = config.icon;

  const breakdown =
    config.breakdownKey && stats ? (stats[config.breakdownKey] as Record<string, number> | undefined) : undefined;
  const breakdownData = breakdown
    ? Object.entries(breakdown)
        .filter(([, count]) => count > 0)
        .map(([name, value]) => ({ name: statusLabel(name), value }))
    : [];

  return (
    <Link to={config.to}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] text-[var(--color-primary)]">
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
            <p className="truncate text-sm font-medium text-[var(--color-text)]">{config.label}</p>
          </div>

          {isLoading || !stats ? (
            <div className="h-8 animate-pulse rounded bg-[var(--color-bg-subtle)]" />
          ) : (
            <>
              <div className="flex items-baseline gap-4">
                <div className="min-w-0">
                  <p className="text-2xl font-semibold text-[var(--color-text)]">{stats[config.primaryKey] as number}</p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">{config.primaryLabel}</p>
                </div>
                {config.secondaryKey && (
                  <div className="min-w-0">
                    <p className="text-lg font-medium text-[var(--color-text)]">
                      {(stats[config.secondaryKey] as number) ?? 0}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">{config.secondaryLabel}</p>
                  </div>
                )}
              </div>

              {breakdownData.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="h-20 w-20 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={breakdownData} dataKey="value" nameKey="name" innerRadius={22} outerRadius={38}>
                          {breakdownData.map((entry, index) => (
                            <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="min-w-0 flex-1 space-y-1">
                    {breakdownData.slice(0, 4).map((row, index) => (
                      <li key={row.name} className="flex items-center gap-1.5 truncate text-xs text-[var(--color-text-muted)]">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                          aria-hidden="true"
                        />
                        <span className="truncate">
                          {row.name}: {row.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
