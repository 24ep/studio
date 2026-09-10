export interface EvalLinkItem {
  id: string;
  applicant: { id: string; name: string; email: string };
  createdBy: { id: string; name: string; email: string };
  token: string;
  url: string;
  expiresAt: string;
  revokedAt?: string | null;
  requireLogin: boolean;
  createdAt: string;
}

export interface EvalLinkQrData {
  name: string;
  url: string;
  expiresAt?: string;
}

export type EvalLinkStatus = 'all' | 'active' | 'expired' | 'revoked';

export function isEvalLinkStatus(value: string): value is EvalLinkStatus {
  return value === 'all' || value === 'active' || value === 'expired' || value === 'revoked';
}

export function formatEvaluationLinkCountdown(expiresAt: string, revokedAt?: string | null) {
  if (revokedAt) {
    return 'revoked';
  }

  const end = new Date(expiresAt).getTime();
  const diff = Math.max(0, end - Date.now());

  if (diff <= 0) {
    return 'expired';
  }

  const seconds = Math.floor(diff / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
}
