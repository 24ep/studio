import { getNetworkErrorText } from './network-error-extractors';
import type { NetworkFailureDetails } from './network-error-types';

export function getNetworkFailureDetails(error: unknown): NetworkFailureDetails {
  const details: NetworkFailureDetails = {
    dnsResolution: false,
    connectionEstablished: false,
    responseReceived: false,
  };

  if (getNetworkErrorText(error).includes('fetch')) {
    details.dnsResolution = true;
    details.connectionEstablished = false;
  }

  return details;
}
