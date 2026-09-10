import type { ApiHealthResult, NetworkHealthResult } from '@/lib/networkUtils';

export interface NetworkDiagnosticsProps {
  className?: string;
  onClose?: () => void;
}

export interface NetworkDiagnosticsResults {
  network: NetworkHealthResult | null;
  api: ApiHealthResult | null;
}
