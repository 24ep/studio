export function buildWebhookLogsQuery({
  page,
  limit,
  filter,
  search,
}: {
  page?: number;
  limit?: number;
  filter: string;
  search: string;
}) {
  const params = new URLSearchParams();

  if (page !== undefined) {
    params.set('page', page.toString());
  }
  if (limit !== undefined) {
    params.set('limit', limit.toString());
  }
  params.set('filter', filter);
  params.set('search', search);

  return params;
}

export function createWebhookTestPayload(timestamp = new Date()) {
  return JSON.stringify({
    test: true,
    timestamp: timestamp.toISOString(),
  }, null, 2);
}

export function formatWebhookDate(dateString: string) {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
}
