export type FaultSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type FaultStatus = 'Open' | 'Investigating';

export type OperationalFault = {
  id: string;
  title: string;
  detail: string;
  source: string;
  severity: FaultSeverity;
  status: FaultStatus;
  detectedAt: string;
  affected: string;
  actionHref: string;
  actionLabel: string;
};

export type MonitorCoverage = {
  label: string;
  healthy: number;
  total: number;
};

export type FaultDetectionResponse = {
  faults: OperationalFault[];
  scannedAt: string;
  monitors: MonitorCoverage[];
};
