"use client";

import {
  NetworkDiagnosticsCard,
  NetworkDiagnosticsContent,
  NetworkDiagnosticsModal,
} from './network-diagnostics-parts';
import type { NetworkDiagnosticsProps } from './network-diagnostics-types';
import { useNetworkDiagnostics } from './use-network-diagnostics';

export function NetworkDiagnostics({ className, onClose }: NetworkDiagnosticsProps) {
  const diagnostics = useNetworkDiagnostics();
  const content = (
    <NetworkDiagnosticsContent
      isRunning={diagnostics.isRunning}
      results={diagnostics.results}
      onRunDiagnostics={diagnostics.runDiagnostics}
    />
  );

  if (onClose) {
    return (
      <NetworkDiagnosticsModal onClose={onClose} content={content} />
    );
  }

  return (
    <NetworkDiagnosticsCard className={className} content={content} />
  );
}
