import {
  deleteWebhookConfigurationsBulk,
  runWebhookBulkAction,
} from "./webhook-management-api";
import { getBulkActionPastTense } from "./webhook-management-controller-utils";

interface PerformWebhookBulkActionOptions {
  action: string;
  selectedCount: number;
  webhookIds: string[];
}

type WebhookBulkActionResult = {
  ok: boolean;
  message: string;
};

export async function performWebhookBulkActionRequest({
  action,
  selectedCount,
  webhookIds,
}: PerformWebhookBulkActionOptions): Promise<WebhookBulkActionResult> {
  if (action === "delete") {
    const successCount = await deleteWebhookConfigurationsBulk(webhookIds);

    if (successCount > 0) {
      return {
        ok: true,
        message: `Successfully deleted ${successCount} webhook${successCount !== 1 ? "s" : ""}`,
      };
    }

    return {
      ok: false,
      message: "Failed to delete webhooks",
    };
  }

  if (await runWebhookBulkAction({ action, webhookIds })) {
    const actionText = getBulkActionPastTense(action);
    return {
      ok: true,
      message: `Successfully ${actionText} ${selectedCount} webhook${selectedCount !== 1 ? "s" : ""}`,
    };
  }

  return {
    ok: false,
    message: "Failed to perform bulk action",
  };
}
