"use client";

import { ArrowPathIcon as Loader2 } from "@heroicons/react/24/outline";

import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApplicantImportQueueBulkActionBar } from "./ApplicantImportQueueBulkActionBar";
import { ApplicantImportQueueSortableHeader } from "./ApplicantImportQueueSortableHeader";
import { ApplicantImportQueueTableBody } from "./ApplicantImportQueueTableBody";
import type { QueueItem } from "./applicant-import-queue-types";

type SortDirection = "asc" | "desc" | null;

interface SortControls {
  sortField: string;
  sortDirection: SortDirection;
  openMenu: string | null;
  onSort: (column: string | null, direction?: SortDirection) => void;
  onMenuClick: (menu: string) => void;
  onMenuClose: () => void;
  onOpenChange: (menu: string) => (open: boolean) => void;
}

interface ApplicantImportUploadQueueTableProps {
  items?: QueueItem[];
  loading: boolean;
  selectedItems: Set<string>;
  selectionMode: "none" | "partial" | "all";
  sortControls: SortControls;
  onBulkDelete: (itemIds: string[]) => void;
  onBulkRetry: (itemIds: string[]) => void;
  onClearSelection: () => void;
  onDeleteItem: (itemId: string) => void;
  onPreviewFile: (item: QueueItem) => void;
  onRetryItem: (itemId: string) => void;
  onSelectAll: () => void;
  onSelectItem: (itemId: string) => void;
  onShowDetails: (item: QueueItem) => void;
}

const QUEUE_TABLE_HEADERS = [
  { field: "id", label: "ID" },
  { field: "file_name", label: "File Name" },
  { field: "position_title", label: "Position" },
  { field: "source_name", label: "Source" },
  { field: "file_size", label: "File Size" },
  { field: "status", label: "Status" },
  { field: "upload_date", label: "Create Date" },
  { field: "process_date", label: "Process Date" },
  { field: "completed_date", label: "Complete Date" },
  { field: "duration", label: "Duration" },
];

export function ApplicantImportUploadQueueTable({
  items,
  loading,
  selectedItems,
  selectionMode,
  sortControls,
  onBulkDelete,
  onBulkRetry,
  onClearSelection,
  onDeleteItem,
  onPreviewFile,
  onRetryItem,
  onSelectAll,
  onSelectItem,
  onShowDetails,
}: ApplicantImportUploadQueueTableProps) {
  return (
    <div className="relative overflow-hidden bg-background">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[1px]">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Updating queue…</span>
          </div>
        </div>
      )}

      <ApplicantImportQueueBulkActionBar
        items={items}
        selectedItems={selectedItems}
        onRetry={onBulkRetry}
        onDelete={onBulkDelete}
        onClear={onClearSelection}
      />

      <div className="overflow-x-auto">
        <Table className="min-w-full table-fixed text-left text-sm">
          <TableHeader className="border-b border-border/70 bg-muted/35 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            <TableRow className="hover:bg-muted/35">
              <TableHead className="w-12 px-4 py-3">
                <Checkbox
                  checked={selectionMode === "all"}
                  ref={null}
                  onCheckedChange={onSelectAll}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </TableHead>
              {QUEUE_TABLE_HEADERS.map(({ field, label }) => (
                <ApplicantImportQueueSortableHeader
                  key={field}
                  field={field}
                  {...sortControls}
                >
                  {label}
                </ApplicantImportQueueSortableHeader>
              ))}
              <TableHead className="w-24 px-4 py-3 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <ApplicantImportQueueTableBody
            items={items}
            selectedItems={selectedItems}
            onSelectItem={onSelectItem}
            onPreviewFile={onPreviewFile}
            onShowDetails={onShowDetails}
            onRetryItem={onRetryItem}
            onDeleteItem={onDeleteItem}
          />
        </Table>
      </div>
    </div>
  );
}
