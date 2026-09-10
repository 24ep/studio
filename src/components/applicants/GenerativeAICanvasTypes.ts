export type CanvasChartType = 'bar' | 'line' | 'pie' | 'doughnut';

export interface CanvasChartData {
  id: string;
  type: CanvasChartType;
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
}

export interface GenerativeAICanvasProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
