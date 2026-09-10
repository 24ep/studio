import WebhookBodyCustomization from './WebhookBodyCustomization';
import { WebhookLogsDialog } from './WebhookLogsDialog';
import { WebhookTestDialog } from './WebhookTestDialog';
import type { WebhookManagementController } from './use-webhook-management-controller';

interface WebhookManagementDialogsProps {
  controller: WebhookManagementController;
}

export function WebhookManagementDialogs({ controller }: WebhookManagementDialogsProps) {
  const customizingWebhook = controller.customizingWebhook;

  return (
    <>
      <WebhookTestDialog
        webhook={controller.selectedWebhookForTest}
        isLoading={controller.testLoading}
        result={controller.testResult}
        onClose={controller.closeTestDialog}
        onTest={controller.testWebhook}
      />

      <WebhookLogsDialog
        webhook={controller.selectedWebhookForLogs}
        logs={controller.webhookLogs}
        isLoading={controller.logsLoading}
        filter={controller.logsFilter}
        search={controller.logsSearch}
        page={controller.logsPage}
        total={controller.logsTotal}
        onClose={controller.closeLogsDialog}
        onFilterChange={controller.handleLogsFilterChange}
        onSearchChange={controller.handleLogsSearch}
        onPageChange={controller.handleLogsPageChange}
        onExport={controller.exportLogs}
      />

      {customizingWebhook && (
        <WebhookBodyCustomization
          webhookId={customizingWebhook.id}
          webhookEvents={customizingWebhook.events}
          initialConfig={{
            body_template: customizingWebhook.body_template ?? undefined,
            field_mappings: customizingWebhook.field_mappings ?? undefined,
            include_metadata: customizingWebhook.include_metadata,
            custom_payload: customizingWebhook.custom_payload,
            body_configs: customizingWebhook.body_configs,
          }}
          onSave={async (config) => {
            await controller.handleBodyConfigSave(customizingWebhook.id, config);
            controller.setCustomizingWebhook(null);
          }}
          onClose={() => controller.setCustomizingWebhook(null)}
        />
      )}
    </>
  );
}
