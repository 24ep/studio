interface WebhookLogsHeaderProps {
  webhookName: string;
}

export function WebhookLogsHeader({
  webhookName,
}: WebhookLogsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">Delivery Logs</h3>
        <p className="text-sm text-muted-foreground">
          View webhook delivery history for {webhookName}
        </p>
      </div>
    </div>
  );
}
