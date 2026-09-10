import { TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WebhookFormDialog } from './WebhookFormDialog';
import type { WebhookManagementController } from './use-webhook-management-controller';

export { WebhookManagementDialogs } from './WebhookManagementDialogs';
export { WebhookManagementPanels } from './WebhookManagementPanels';

interface WebhookManagementViewPartProps {
  controller: WebhookManagementController;
}

export function WebhookManagementHeader({ controller }: WebhookManagementViewPartProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Webhook Management</h1>
        <p className="text-muted-foreground">
          Configure real-time notifications and integrations for your recruitment system
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={controller.handleQuickTest}
          disabled={controller.webhooks.length === 0}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          Quick Test
        </Button>

        <WebhookFormDialog
          open={controller.isDialogOpen}
          editingWebhook={controller.editingWebhook}
          formData={controller.formData}
          customHeaders={controller.customHeaders}
          onOpenChange={controller.handleDialogOpen}
          onSubmit={controller.handleSubmit}
          onFormDataChange={controller.setFormData}
          onAddCustomHeader={controller.addCustomHeader}
          onRemoveCustomHeader={controller.removeCustomHeader}
          onUpdateCustomHeader={controller.updateCustomHeader}
        />
      </div>
    </div>
  );
}
