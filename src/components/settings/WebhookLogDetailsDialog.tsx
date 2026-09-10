import { ExpandablePayload } from '@/components/ui/ExpandablePayload';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { WebhookLog } from './webhook-delivery-logs-types';
import {
  formatWebhookLogDate,
  formatWebhookLogDuration,
} from './webhook-delivery-logs-utils';

interface WebhookLogDetailsDialogContentProps {
  log: WebhookLog;
}

export function WebhookLogDetailsDialogContent({
  log,
}: WebhookLogDetailsDialogContentProps) {
  return (
    <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Webhook Log Details</DialogTitle>
        <DialogDescription>
          Event: {log.event_type} - {formatWebhookLogDate(log.createdAt)}
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="payload" className="w-full">
        <TabsList variant="subnav">
          <TabsTrigger value="payload">Payload</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="payload" className="space-y-4">
          <ExpandablePayload
            data={log.payload}
            title="Request Payload"
            maxHeight="max-h-60"
          />
        </TabsContent>

        <TabsContent value="response" className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Response Status</Label>
            <div className="mt-2 rounded-md bg-muted p-2">
              {log.response_status || 'No response'}
            </div>
          </div>

          {log.response_body && (
            <ExpandablePayload
              data={log.response_body}
              title="Response Body"
              maxHeight="max-h-60"
            />
          )}

          {log.error_message && (
            <div>
              <Label className="text-sm font-medium">Error Message</Label>
              <div className="mt-2 rounded-md bg-red-50 p-2 text-red-700">
                {log.error_message}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <WebhookLogDetail label="Event Type" value={log.event_type} />
            <WebhookLogDetail label="Success" value={log.success ? 'Yes' : 'No'} />
            <WebhookLogDetail label="Duration" value={formatWebhookLogDuration(log.duration_ms)} />
            <WebhookLogDetail label="Response Status" value={log.response_status || 'N/A'} />
          </div>

          <Separator />

          <WebhookLogDetail label="Timestamp" value={formatWebhookLogDate(log.createdAt)} />
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}

function WebhookLogDetail({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
