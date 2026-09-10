"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getUploadQueueItemsDescription,
  getUploadQueueLastUpdatedText,
  getUploadQueuePaginationLabel,
  getUploadQueueTotalPages,
  isUploadQueueNextPageDisabled,
  isUploadQueuePreviousPageDisabled,
  shouldShowUploadQueuePagination,
} from "./applicants/applicant-import-queue-utils";
import type { QueueItem, QueueResponse } from "./applicants/applicant-import-queue-types";
import { UploadQueueItems as UploadQueueItemsList } from "./UploadQueueStatusItems";

interface UploadQueueItemsCardProps {
  queueData: QueueResponse | null;
  loading: boolean;
  page: number;
  pageSize: number;
  lastUpdate: Date | null;
  onItemClick: (item: QueueItem) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function UploadQueueItemsCard({
  queueData,
  loading,
  page,
  pageSize,
  lastUpdate,
  onItemClick,
  onPreviousPage,
  onNextPage,
}: UploadQueueItemsCardProps) {
  const totalPages = getUploadQueueTotalPages(queueData?.total, pageSize);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Queue Items</CardTitle>
            <CardDescription>
              {getUploadQueueItemsDescription(queueData?.total)}
              {lastUpdate && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {getUploadQueueLastUpdatedText(lastUpdate)}
                </span>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <UploadQueueItemsList
          queueData={queueData}
          loading={loading}
          onItemClick={onItemClick}
        />

        {shouldShowUploadQueuePagination(totalPages) && (
          <UploadQueuePagination
            page={page}
            totalPages={totalPages}
            onPreviousPage={onPreviousPage}
            onNextPage={onNextPage}
          />
        )}
      </CardContent>
    </Card>
  );
}

function UploadQueuePagination({
  page,
  totalPages,
  onPreviousPage,
  onNextPage,
}: {
  page: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-muted-foreground">
        {getUploadQueuePaginationLabel(page, totalPages)}
      </div>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={onPreviousPage} disabled={isUploadQueuePreviousPageDisabled(page)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNextPage} disabled={isUploadQueueNextPageDisabled(page, totalPages)}>
          Next
        </Button>
      </div>
    </div>
  );
}
