import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError } from "@/lib/api-client";

import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "./api";
import type { Notification, NotificationListParams } from "./types";

interface PageParams {
  page?: number;
  page_size?: number;
}

const NOTIFICATIONS_KEY = ["notifications"] as const;

export function useNotificationList(params: PageParams & NotificationListParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "list", params],
    queryFn: () => fetchNotifications(params),
    enabled: options?.enabled,
    placeholderData: (previousData) => previousData,
  });
}

/** There's no dedicated unread-count endpoint — the pagination envelope's own `count` on a
 * `page_size=1, is_read=false` request gives the true total cheaply, without pulling every row.
 * Polls every 30s so the topbar bell reflects new notifications without a full page reload. */
export function useUnreadCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "unread-count"],
    queryFn: () => fetchNotifications({ page_size: 1, is_read: false }),
    select: (data) => data.count,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<Notification, ApiError, string>({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  });
}
