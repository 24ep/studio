"use client";

import { useModalCleanupMonitor } from '@/lib/modal-cleanup';

export function ModalCleanupMonitor() {
  useModalCleanupMonitor();
  return null; // This component doesn't render anything
}
