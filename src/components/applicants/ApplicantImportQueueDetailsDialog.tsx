"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { QueueItem } from './applicant-import-queue-types';
import {
  ApplicantImportQueueDetailsTab,
  ApplicantImportQueueErrorTab,
  ApplicantImportQueueWebhookTab,
} from './ApplicantImportQueueDetailsDialogParts';

interface ApplicantImportQueueDetailsDialogProps {
  item: QueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicantImportQueueDetailsDialog({
  item,
  open,
  onOpenChange,
}: ApplicantImportQueueDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[80vh] w-full max-w-3xl overflow-y-auto"
        dialogId="Applicant-import-upload-queue-modal"
      >
        <DialogHeader>
          <DialogTitle>Queue Item Details</DialogTitle>
          <DialogDescription>
            Detailed information about the selected queue item
          </DialogDescription>
        </DialogHeader>

        {item ? (
          <div className="space-y-4">
            <Tabs defaultValue="details">
              <TabsList variant="subnav">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="webhook">Webhook Send</TabsTrigger>
                {item.error ? (
                  <TabsTrigger value="errors">Error Logs</TabsTrigger>
                ) : null}
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <ApplicantImportQueueDetailsTab item={item} />
              </TabsContent>

              <TabsContent value="webhook" className="mt-4">
                <ApplicantImportQueueWebhookTab item={item} />
              </TabsContent>

              {item.error ? (
                <TabsContent value="errors" className="mt-4">
                  <ApplicantImportQueueErrorTab item={item} />
                </TabsContent>
              ) : null}
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
