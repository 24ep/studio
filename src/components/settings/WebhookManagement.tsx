'use client';

import { WebhookManagementView } from './WebhookManagementView';
import { useWebhookManagementController } from './use-webhook-management-controller';

export default function WebhookManagement() {
  const controller = useWebhookManagementController();

  return <WebhookManagementView controller={controller} />;
}
