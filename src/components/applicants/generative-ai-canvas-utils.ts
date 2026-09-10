import type { CanvasChartData, CanvasChartType } from './GenerativeAICanvasTypes';

const CHART_SELECTOR = '[data-chart-id]';
const SERIES_COLOR = 'rgba(59, 130, 246, 0.5)';
const SERIES_BORDER_COLOR = 'rgba(59, 130, 246, 1)';
const CATEGORY_COLORS = [
  'rgba(59, 130, 246, 0.5)',
  'rgba(16, 185, 129, 0.5)',
  'rgba(245, 158, 11, 0.5)',
  'rgba(239, 68, 68, 0.5)',
];
const CATEGORY_BORDER_COLORS = [
  'rgba(59, 130, 246, 1)',
  'rgba(16, 185, 129, 1)',
  'rgba(245, 158, 11, 1)',
  'rgba(239, 68, 68, 1)',
];

export function parseChartsFromContent(htmlContent: string): CanvasChartData[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent || '', 'text/html');
  const parsedCharts: CanvasChartData[] = [];

  doc.querySelectorAll(CHART_SELECTOR).forEach((el) => {
    const chartId = el.getAttribute('data-chart-id');
    const chartType = el.getAttribute('data-chart-type') as CanvasChartType | null;
    const chartTitle = el.getAttribute('data-chart-title') || '';
    const chartDataStr = el.getAttribute('data-chart-data');

    if (!chartId || !chartType || !chartDataStr) return;

    try {
      parsedCharts.push({
        id: chartId,
        type: chartType,
        title: chartTitle,
        data: JSON.parse(chartDataStr) as CanvasChartData['data'],
      });
    } catch (error) {
      console.error('Error parsing chart data:', error);
    }
  });

  return parsedCharts;
}

export function updateContentWithCharts(
  updatedCharts: CanvasChartData[],
  htmlContent: string
) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent || '<p></p>', 'text/html');

    doc.querySelectorAll(CHART_SELECTOR).forEach((el) => el.remove());
    updatedCharts.forEach((chart) => appendChartPlaceholder(doc, chart));

    return doc.body.innerHTML;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating content with charts:', error);
    }
    return htmlContent;
  }
}

export function createChartId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `chart-${crypto.randomUUID()}`;
  }

  return `chart-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createDefaultChartData(chartType: CanvasChartType): CanvasChartData['data'] {
  const usesSeriesColor = chartType === 'bar' || chartType === 'line';

  return {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{
      label: 'Sample Data',
      data: [12, 19, 3, 5],
      backgroundColor: usesSeriesColor ? SERIES_COLOR : CATEGORY_COLORS,
      borderColor: usesSeriesColor ? SERIES_BORDER_COLOR : CATEGORY_BORDER_COLORS,
      borderWidth: 1,
    }],
  };
}

function appendChartPlaceholder(doc: Document, chart: CanvasChartData) {
  const chartDiv = doc.createElement('div');
  chartDiv.setAttribute('data-chart-id', chart.id);
  chartDiv.setAttribute('data-chart-type', chart.type);
  chartDiv.setAttribute('data-chart-title', chart.title);
  chartDiv.setAttribute('data-chart-data', JSON.stringify(chart.data));
  chartDiv.className = 'chart-container my-4 p-4 border rounded-lg bg-muted/30';

  const titleDiv = doc.createElement('div');
  titleDiv.className = 'text-sm font-medium mb-2';
  titleDiv.textContent = chart.title;

  const placeholderDiv = doc.createElement('div');
  placeholderDiv.className = 'chart-placeholder';
  placeholderDiv.textContent = 'Chart will be rendered here';

  chartDiv.appendChild(titleDiv);
  chartDiv.appendChild(placeholderDiv);
  doc.body.appendChild(chartDiv);
}
