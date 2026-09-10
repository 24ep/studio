import type { Webhook } from "./webhook-management-data";

export type WebhookViewMode = "grid" | "list";

export interface WebhookConfigurationsActions {
  isSelected: (webhookId: string) => boolean;
  onCreate: () => void;
  onSelectAll: () => void;
  onWebhookSelection: (webhookId: string, selected: boolean) => void;
  onCopyToClipboard: (text: string, id: string) => void;
  onViewLogs: (webhook: Webhook | null) => void;
  onTest: (webhook: Webhook | null) => void;
  onCustomizeBody: (webhook: Webhook | null) => void;
  onEdit: (webhook: Webhook) => void;
  onDelete: (webhookId: string) => void;
}
