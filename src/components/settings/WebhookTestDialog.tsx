import { AlertTriangle, CheckCircle, TestTube } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import type { Webhook } from './webhook-management-data';
import type { WebhookTestResult } from './webhook-analytics-utils';

interface WebhookTestDialogProps {
  webhook: Webhook | null;
  isLoading: boolean;
  result: WebhookTestResult | null;
  onClose: () => void;
  onTest: () => void;
}

function formatWebhookTestResponse(response: unknown) {
  if (typeof response === 'string') {
    return response;
  }

  return JSON.stringify(response, null, 2) ?? '';
}

export function WebhookTestDialog({
  webhook,
  isLoading,
  result,
  onClose,
  onTest,
}: WebhookTestDialogProps) {
  if (!webhook) {
    return null;
  }

  return (
    <Dialog open={!!webhook} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Webhook
          </DialogTitle>
          <DialogDescription>
            {isLoading ? 'Testing webhook...' : `Test webhook: ${webhook.name}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="text-lg">Sending test request...</span>
            </div>
          </div>
        ) : result ? (
          <div className="space-y-4">
            {result.message && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{result.message}</span>
                </div>
              </div>
            )}
            {result.error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">{result.error}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {result.status && (
                <div>
                  <Label className="text-sm font-medium">Status Code</Label>
                  <div className="mt-1 p-2 bg-muted rounded font-mono text-sm">{result.status}</div>
                </div>
              )}
              {result.webhook_id && (
                <div>
                  <Label className="text-sm font-medium">Webhook ID</Label>
                  <div className="mt-1 p-2 bg-muted rounded font-mono text-sm">{result.webhook_id}</div>
                </div>
              )}
            </div>

            {result.response !== undefined && (
              <div>
                <Label className="text-sm font-medium">Response Body</Label>
                <div className="mt-1 p-3 bg-muted rounded-lg">
                  <pre className="text-xs font-mono overflow-x-auto max-h-40">
                    {formatWebhookTestResponse(result.response)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Send Test" to test the webhook</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onTest} disabled={isLoading}>
            Send Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
