"use client";

import { useState } from 'react';
import {
  checkApiHealth,
  checkNetworkHealth,
} from '@/lib/networkUtils';
import type { NetworkDiagnosticsResults } from './network-diagnostics-types';

const DIAGNOSTIC_API_ENDPOINTS = [
  '/api/health',
  '/api/applicants',
  '/api/positions',
  '/api/stages',
];

const initialNetworkDiagnosticsResults: NetworkDiagnosticsResults = {
  network: null,
  api: null,
};

const failedNetworkDiagnosticsResults: NetworkDiagnosticsResults = {
  network: {
    isHealthy: false,
    latency: 0,
    error: 'Diagnostics failed to run',
  },
  api: {
    isHealthy: false,
    endpoints: {},
  },
};

export function useNetworkDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<NetworkDiagnosticsResults>(initialNetworkDiagnosticsResults);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults(initialNetworkDiagnosticsResults);

    try {
      const networkResult = await checkNetworkHealth('/api/health', 5000);
      const apiResult = await checkApiHealth(DIAGNOSTIC_API_ENDPOINTS);

      setResults({ network: networkResult, api: apiResult });
    } catch (error) {
      console.error('Diagnostics failed:', error);
      setResults(failedNetworkDiagnosticsResults);
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    results,
    runDiagnostics,
  };
}
