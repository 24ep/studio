import { Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { WebhookBodyCustomizationController } from './use-webhook-body-customization';
import { getDefaultWebhookBodyTemplate } from './webhook-body-customization-types';

interface WebhookBodyTemplateTabProps {
  controller: WebhookBodyCustomizationController;
}

export function WebhookBodyTemplateTab({ controller }: WebhookBodyTemplateTabProps) {
  const {
    bodyConfigs,
    globalBodyTemplate,
    selectedEvent,
    setGlobalBodyTemplate,
    updateEventConfig,
  } = controller;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Body Template</CardTitle>
        <CardDescription>
          Define the JSON structure for the webhook payload. Use placeholders like {"{{field_name}}"} for dynamic values.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="body-template" className="text-sm font-medium">Template</Label>
            <Textarea
              id="body-template"
              value={bodyConfigs[selectedEvent]?.body_template || globalBodyTemplate || getDefaultWebhookBodyTemplate(selectedEvent)}
              onChange={(event) => {
                if (bodyConfigs[selectedEvent]) {
                  updateEventConfig(selectedEvent, 'body_template', event.target.value);
                } else {
                  setGlobalBodyTemplate(event.target.value);
                }
              }}
              placeholder="Enter JSON template..."
              className="font-mono text-sm min-h-[200px]"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Available Placeholders:</p>
                <ul className="space-y-1 text-xs">
                  <li><code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">{"{{event}}"}</code> - Event type</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">{"{{timestamp}}"}</code> - Current timestamp</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">{"{{data}}"}</code> - Event data</li>
                  <li><code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">{"{{webhook_id}}"}</code> - Webhook ID</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
