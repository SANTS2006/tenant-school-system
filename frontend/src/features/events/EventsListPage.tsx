import { Calendar, CalendarClock, Plus, Search, Send, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Select } from "@/components/ui/Select";
import { FullPageSpinner, Spinner } from "@/components/ui/Spinner";
import { StatRow } from "@/components/ui/StatRow";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRowLink,
} from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { useHasPermission } from "@/features/auth/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useSummaryStats } from "@/hooks/useSummaryStats";
import type { ApiError } from "@/lib/api-client";
import { generalErrorMessage } from "@/lib/formErrors";

import { categoryLabel, eventStatusLabel, eventStatusTone } from "./statusTone";
import type { EventCategory, EventStatus } from "./types";
import { useCancelEvent, useDeleteEvent, useEventList, usePublishEvent } from "./useEventsCrud";

const PAGE_SIZE = 25;
const CATEGORIES: EventCategory[] = ["academic", "sports", "cultural", "meeting", "holiday", "other"];
const STATUSES: EventStatus[] = ["draft", "published", "cancelled"];

export function EventsListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const canCreate = useHasPermission("events.create");
  const canUpdate = useHasPermission("events.update");
  const canDelete = useHasPermission("events.delete");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [status, setStatus] = useState<EventStatus | "">("");
  const debouncedSearch = useDebounce(search);

  const filterParams = {
    search: debouncedSearch || undefined,
    category: category || undefined,
    status: status || undefined,
  };
  const { data, isLoading, isError, error, isFetching } = useEventList({
    page,
    page_size: PAGE_SIZE,
    ordering: "-start_datetime",
    ...filterParams,
  });
  const { data: stats } = useSummaryStats("events", filterParams);
  const deleteEvent = useDeleteEvent();
  const publishEvent = usePublishEvent();
  const cancelEvent = useCancelEvent();

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: `Delete event "${title}"?`,
      description: "This cannot be undone.",
      tone: "danger",
    });
    if (!ok) return;
    deleteEvent.mutate(id, {
      onSuccess: () => showToast({ title: `"${title}" deleted` }),
      onError: (err) => showToast({ title: "Failed to delete", description: err.message, tone: "danger" }),
    });
  };

  const handlePublish = (id: string) => {
    publishEvent.mutate(id, {
      onSuccess: (result) => showToast({ title: result.message }),
      onError: (err: ApiError) =>
        showToast({ title: "Could not publish", description: generalErrorMessage(err), tone: "danger" }),
    });
  };

  const handleCancel = async (id: string, title: string) => {
    const ok = await confirm({
      title: `Cancel "${title}"?`,
      description: "Registered attendees will see it as cancelled.",
      tone: "danger",
    });
    if (!ok) return;
    cancelEvent.mutate(id, {
      onSuccess: () => showToast({ title: "Event cancelled" }),
      onError: (err: ApiError) =>
        showToast({ title: "Could not cancel", description: generalErrorMessage(err), tone: "danger" }),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Events</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">School events, meetings, and activities.</p>
      </div>

      {stats && (
        <ScrollReveal>
          <StatRow
            items={[
              { key: "total", label: "Total events", value: stats.total as number, icon: Calendar },
              { key: "published", label: "Published", value: stats.published as number, icon: Send },
              { key: "upcoming", label: "Upcoming", value: stats.upcoming as number, icon: CalendarClock },
            ]}
          />
        </ScrollReveal>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="w-full max-w-xs">
            <Input
              icon={Search}
              placeholder="Search by title or location"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-full max-w-[160px]">
            <Select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as EventCategory | "");
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {categoryLabel(option)}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full max-w-[160px]">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as EventStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {eventStatusLabel(option)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/events/new")}>
            <Plus className="size-4" aria-hidden="true" />
            New event
          </Button>
        )}
      </div>

      {isError && <Alert tone="danger">{(error as ApiError).message}</Alert>}

      {isLoading ? (
        <FullPageSpinner />
      ) : data && data.results.length === 0 ? (
        <EmptyState icon={Calendar} title="No events found" description="Try adjusting your filters." />
      ) : data ? (
        <ScrollReveal>
        <TableContainer>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>When</TableHeaderCell>
                <TableHeaderCell>Audience</TableHeaderCell>
                <TableHeaderCell>Attendance</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {data.results.map((event) => (
                <TableRowLink key={event.id} onClick={() => navigate(`/events/${event.id}`)}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{new Date(event.start_datetime).toLocaleString()}</TableCell>
                  <TableCell>{categoryLabel(event.category)}</TableCell>
                  <TableCell>
                    {event.registered_count}
                    {event.capacity !== null && ` / ${event.capacity}`}
                  </TableCell>
                  <TableCell>
                    <Badge tone={eventStatusTone(event.status)}>{eventStatusLabel(event.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canUpdate && event.status === "draft" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(event.id);
                          }}
                          disabled={publishEvent.isPending}
                          aria-label={`Publish ${event.title}`}
                          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-success)] disabled:opacity-40"
                        >
                          <Send className="size-4" aria-hidden="true" />
                        </button>
                      )}
                      {canUpdate && event.status === "published" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(event.id, event.title);
                          }}
                          disabled={cancelEvent.isPending}
                          aria-label={`Cancel ${event.title}`}
                          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-danger)] disabled:opacity-40"
                        >
                          <XCircle className="size-4" aria-hidden="true" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(event.id, event.title);
                          }}
                          aria-label={`Delete ${event.title}`}
                          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRowLink>
              ))}
            </TableBody>
          </Table>
          <div className="border-t border-[var(--color-border)]">
            <Pagination page={page} pageSize={PAGE_SIZE} count={data.count} onPageChange={setPage} />
          </div>
        </TableContainer>
        </ScrollReveal>
      ) : null}

      {isFetching && !isLoading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
