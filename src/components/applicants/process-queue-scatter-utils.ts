import type { ProcessQueueAnalyticsData } from './process-queue-analytics-utils';

export function getProcessQueuePointColor(status: string, opacity: string) {
  switch (status.toLowerCase()) {
    case 'success':
      return `rgba(34, 197, 94, ${opacity})`;
    case 'failed':
      return `rgba(239, 68, 68, ${opacity})`;
    case 'inprocess':
      return `rgba(234, 179, 8, ${opacity})`;
    case 'queued':
      return `rgba(59, 130, 246, ${opacity})`;
    default:
      return `rgba(107, 114, 128, ${opacity})`;
  }
}

export function buildProcessQueueScatterDataset(data: ProcessQueueAnalyticsData) {
  return {
    datasets: [
      {
        label: 'Duration (minutes)',
        data: data.scatterData.map((item) => ({
          x: new Date(item.x),
          y: item.y,
        })),
        backgroundColor: data.scatterData.map((item) => getProcessQueuePointColor(item.status, '0.8')),
        borderColor: data.scatterData.map((item) => getProcessQueuePointColor(item.status, '1')),
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };
}
