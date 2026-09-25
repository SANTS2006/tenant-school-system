import { CheckCircle2, Megaphone, Plus, Search, Send, Trash2, Users } from "lucide-react";
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

import { publishedTone, targetTypeLabel } from "./statusTone";
import type { TargetType } from "./types";
import { useAnnouncementList, useDeleteAnnouncement, usePublishAnnouncement } from "./useCommunicationsCrud";

const PAGE_SIZE = 25;
const TARGET_TYPES: TargetType[] = [
  "school",
  "class",
  "section",
  "department",
  "staff",
  "students",
  "parents",
  "specific_users",
];

export function AnnouncementsListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const canCreate = useHasPermission("communications.create");
  const canDelete = useHasPermission("communications.delete");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [targetType, setTargetType] = useState<TargetType | "">("");
  const debouncedSearch = useDebounce(search);

  const filterParams = {
    search: debouncedSearch || undefined,
    target_type: targetType || undefined,
  };
  const { data, isLoading, isError, error, isFetching } = useAnnouncementList({
    page,
    page_size: PAGE_SIZE,
    ...filterParams,
  });
  const { data: stats } = useSummaryStats("communications/announcements", filterParams);
  const deleteAnnouncement = useDeleteAnnouncement();
  const publishAnnouncement = usePublishAnnouncement();

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: `Delete announcement "${title}"?`,
      description: "This cannot be undone.",
      tone: "danger",
    });
    if (!ok) return;
    deleteAnnouncement.mutate(id, {
      onSuccess: () => showToast({ title: `"${title}" deleted` }),
      onError: (err) => showToast({ title: "Failed to delete", description: err.message, tone: "danger" }),
    });
  };

  const handlePublish = (id: string) => {
    publishAnnouncement.mutate(id, {
      onSuccess: (result) => showToast({ title: result.message }),
      onError: (err: ApiError) =>
        showToast({ title: "Could not publish", description: generalErrorMessage(err), tone: "danger" }),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Communications</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">School-wide and targeted announcements.</p>
      </div>

      {stats && (
        <ScrollReveal>
          <StatRow
            items={[
              { key: "total", label: "Total announcements", value: stats.total as number, icon: Megaphone },
              { key: "active", label: "Active", value: stats.active as number, tone: "success", icon: CheckCircle2 },
            ]}
          />
        </ScrollReveal>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="w-full max-w-xs">
            <Input
              icon={Search}
              placeholder="Search by title or body"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-full max-w-[180px]">
            <Select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value as TargetType | "");
                setPage(1);
              }}
            >
              <option value="">All audiences</option>
              {TARGET_TYPES.map((option) => (
                <option key={option} value={option}>
                  {targetTypeLabel(option)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/communications/new")}>
            <Plus className="size-4" aria-hidden="true" />
            New announcement
          </Button>
        )}
      </div>

      {isError && <Alert tone="danger">{(error as ApiError).message}</Alert>}

      {isLoading ? (
        <FullPageSpinner />
      ) : data && data.results.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements found" description="Try adjusting your filters." />
      ) : data ? (
        <ScrollReveal>
        <TableContainer>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Audience</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="text-right">Actions</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {data.results.map((announcement) => (
                <TableRowLink
                  key={announcement.id}
                  onClick={() => navigate(`/communications/${announcement.id}/edit`)}
                >
                  <TableCell className="font-medium">{announcement.title}</TableCell>
                  <TableCell>
                    {targetTypeLabel(announcement.target_type)}
                    {announcement.target_class_name && ` — ${announcement.target_class_name}`}
                    {announcement.target_section_name && ` — ${announcement.target_section_name}`}
                    {announcement.target_department_name && ` — ${announcement.target_department_name}`}
                  </TableCell>
                  <TableCell>
                    <Badge tone={publishedTone(announcement.published_at)}>
                      {announcement.published_at ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {announcement.target_type === "specific_users" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/communications/${announcement.id}/recipients`);
                          }}
                          aria-label={`Manage recipients for ${announcement.title}`}
                          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-primary)]"
                        >
                          <Users className="size-4" aria-hidden="true" />
                        </button>
                      )}
                      {canCreate && !announcement.published_at && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublish(announcement.id);
                          }}
                          disabled={publishAnnouncement.isPending}
                          aria-label={`Publish ${announcement.title}`}
                          className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-success)] disabled:opacity-40"
                        >
                          <Send className="size-4" aria-hidden="true" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(announcement.id, announcement.title);
                          }}
                          aria-label={`Delete ${announcement.title}`}
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
