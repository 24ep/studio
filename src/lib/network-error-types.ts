export interface NetworkFailureDetails {
  dnsResolution: boolean;
  connectionEstablished: boolean;
  responseReceived: boolean;
}

export type ErrorLikeRecord = Record<string, unknown>;
