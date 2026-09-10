'use client';

import { Code } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useWebhookBodyCustomization } from './use-webhook-body-customization';
import { WebhookBodyCustomizationEditor } from './WebhookBodyCustomizationEditor';
import { WebhookBodyCustomizationFooter } from './WebhookBodyCustomizationFooter';
import { WebhookBodyCustomizationSidebar } from './WebhookBodyCustomizationSidebar';
import type { WebhookBodyCustomizationProps } from './webhook-body-customization-types';

export default function WebhookBodyCustomization({
  webhookEvents,
  initialConfig,
  onSave,
}: WebhookBodyCustomizationProps) {
  const controller = useWebhookBodyCustomization({
    webhookEvents,
    initialConfig,
    onSave,
  });

  return (
    <TooltipProvider>
      <Dialog open={controller.isOpen} onOpenChange={controller.setIsOpen}>
        <DialogContent className="max-w-7xl p-0 overflow-hidden" dialogId="webhook-body-customization-modal">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Code className="h-5 w-5" />
              Webhook Body Customization
            </DialogTitle>
            <DialogDescription>
              Customize the payload structure and field mappings for your webhook events.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[80vh]">
            <WebhookBodyCustomizationSidebar
              controller={controller}
              webhookEvents={webhookEvents}
            />
            <WebhookBodyCustomizationEditor controller={controller} />
          </div>

          <WebhookBodyCustomizationFooter controller={controller} />
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
