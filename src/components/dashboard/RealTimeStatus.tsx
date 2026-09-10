"use client";

import React, { useEffect } from 'react';
import { useSharedSSE } from '@/hooks/use-shared-sse';

interface RealTimeStatusProps {
  onDataUpdate?: () => void;
}

export function RealTimeStatus({ onDataUpdate }: RealTimeStatusProps) {
  const { isConnected, eventCount, lastUpdate, error, subscribeToEvents } = useSharedSSE();

  useEffect(() => {
    // Subscribe to events and trigger data updates
    const unsubscribe = subscribeToEvents((event) => {
      // Trigger data update callback for meaningful events
      if (onDataUpdate && !['keepalive', 'connected'].includes(event.type)) {
        onDataUpdate();
      }
    });

    return unsubscribe;
  }, [onDataUpdate, subscribeToEvents]);

  return null;
}