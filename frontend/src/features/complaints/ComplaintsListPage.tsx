import { CheckCircle2, Clock, MessageSquareWarning, Plus, Search, Send } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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
import { useHasPermission } from "@/features/auth/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { useSummaryStats } from "@/hooks/useSummaryStats";
import type { ApiError } from "@/lib/api-client";

import { categoryLabel, priorityLabel, priorityTone, statusLabel, statusTone } from "./statusTone";
import type { ComplaintCategory, ComplaintPriority, ComplaintStatus } from "./types";
import { useComplaintList } from "./useComplaintsCrud";

const PAGE_SIZE = 25;
const CATEGORIES: ComplaintCategory[] = ["academic", "facility", "behavioral", "administrative", "other"];
const STATUSES: ComplaintStatus[] = ["submitted", "under_review", "resolved", "rejected"];
const PRIORITIES: ComplaintPriority[] = ["low", "normal", "high"];

export function ComplaintsListPage() {
  const navigate = useNavigate();
  const canViewAll = useHasPermission("complaints.view");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [status, setStatus] = useState<ComplaintStatus | "">("");
  const [priority, setPriority] = useState<ComplaintPriority | "">("");
  const debouncedSearch = useDebounce(search);

  const filterParams = {
    search: debouncedSearch || undefined,
    category: category || undefined,
    status: status || undefined,
    priority: priority || undefined,
  };
  const { data, isLoading, isError, error, isFetching } = useComplaintList({
    page,
    page_size: PAGE_SIZE,
    ordering: "-created_at",
    ...filterParams,
  });
  const { data: stats } = useSummaryStats("complaints", filterParams);

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Complaints</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {canViewAll ? "Every complaint submitted in your school." : "Complaints and suggestions you've submitted."}
        </p>
      </div>

      {stats && (
        <ScrollReveal>
          <StatRow
            items={[
              { key: "total", label: "Total", value: stats.total as number, icon: MessageSquareWarning },
              { key: "submitted", label: "Submitted", value: stats.submitted as number, icon: Send },
              { key: "under_review", label: "Under review", value: stats.under_review as number, icon: Clock },
              { key: "resolved", label: "Resolved", value: stats.resolved as number, tone: "success", icon: CheckCircle2 },
            ]}
          />
        </ScrollReveal>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="w-full max-w-xs">
            <Input
              icon={Search}
              placeholder="Search by subject or description"
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
                setCategory(e.target.value as ComplaintCategory | "");
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
                setStatus(e.target.value as ComplaintStatus | "");
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {STATUSES.map((option) => (
                <option key={option} value={option}>
                  {statusLabel(option)}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full max-w-[140px]">
            <Select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as ComplaintPriority | "");
                setPage(1);
              }}
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((option) => (
                <option key={option} value={option}>
                  {priorityLabel(option)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <Button onClick={() => navigate("/complaints/new")}>
          <Plus className="size-4" aria-hidden="true" />
          New complaint
        </Button>
      </div>

      {isError && <Alert tone="danger">{(error as ApiError).message}</Alert>}

      {isLoading ? (
        <FullPageSpinner />
      ) : data && data.results.length === 0 ? (
        <EmptyState icon={MessageSquareWarning} title="No complaints found" description="Try adjusting your filters." />
      ) : data ? (
        <ScrollReveal>
        <TableContainer>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Subject</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                {canViewAll && <TableHeaderCell>Submitted by</TableHeaderCell>}
                <TableHeaderCell>Priority</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {data.results.map((complaint) => (
                <TableRowLink key={complaint.id} onClick={() => navigate(`/complaints/${complaint.id}`)}>
                  <TableCell className="font-medium">{complaint.subject}</TableCell>
                  <TableCell>{categoryLabel(complaint.category)}</TableCell>
                  {canViewAll && (
                    <TableCell>
                      {complaint.submitted_by_name ?? <span className="text-[var(--color-text-muted)] italic">Anonymous</span>}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge tone={priorityTone(complaint.priority)}>{priorityLabel(complaint.priority)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge tone={statusTone(complaint.status)}>{statusLabel(complaint.status)}</Badge>
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
