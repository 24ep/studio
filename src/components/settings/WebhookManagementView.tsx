import { TooltipProvider } from '@/components/ui/tooltip';
import { WebhookManagementErrorState } from './WebhookManagementErrorState';
import { WEBHOOK_SCROLLBAR_STYLES } from './WebhookManagementStyles';
import {
  WebhookManagementDialogs,
  WebhookManagementHeader,
  WebhookManagementPanels,
} from './WebhookManagementViewParts';
import type { WebhookManagementController } from './use-webhook-management-controller';

interface WebhookManagementViewProps {
  controller: WebhookManagementController;
}

export function WebhookManagementView({ controller }: WebhookManagementViewProps) {
  if (controller.error) {
    return <WebhookManagementErrorState error={controller.error} />;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: WEBHOOK_SCROLLBAR_STYLES }} />
      <TooltipProvider>
        <div className="h-full flex flex-col p-6">
          <WebhookManagementHeader controller={controller} />
          <WebhookManagementPanels controller={controller} />
          <WebhookManagementDialogs controller={controller} />
        </div>
      </TooltipProvider>
    </>
  );
}
