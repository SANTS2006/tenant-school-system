import { apiClient } from "@/lib/api-client";

// Every field is optional — the backend omits whichever of these the requesting user lacks the
// domain `.view` permission for, rather than requiring `reports.view` just to load a dashboard.
export interface DashboardOverview {
  active_students?: number;
  active_staff?: number;
  todays_attendance_rate_percent?: number | null;
  outstanding_fees?: number;
  low_stock_items?: number;
  pending_purchase_requests?: number;
}

interface DashboardEnvelope {
  success: boolean;
  message: string;
  code: string;
  dashboard: DashboardOverview;
}

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const { data } = await apiClient.get<DashboardEnvelope>("/reports/dashboard/");
  return data.dashboard;
}
