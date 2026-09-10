import { Eye } from 'lucide-react';

import type { WebhookFormData } from './webhook-management-data';

interface WebhookRequestPreviewProps {
  formData: WebhookFormData;
}

export function WebhookRequestPreview({ formData }: WebhookRequestPreviewProps) {
  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        <Eye className="h-4 w-4" />
        Request Preview
      </h4>
      <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
        <pre className="overflow-x-auto font-mono text-xs">
          {JSON.stringify({
            event: formData.events[0] || 'webhook.test',
            timestamp: new Date().toISOString(),
            data: { example: 'Sample data will be sent here' },
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

