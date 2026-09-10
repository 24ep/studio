"use client";

import { useEffect } from 'react';
import { setupGlobalResizeObserverErrorHandler } from '@/lib/resize-observer-utils';

export function ResizeObserverInitializer() {
  useEffect(() => {
    // Initialize global ResizeObserver error handler on the client
    // Note: the util's TS signature declares void, so don't rely on a return value
    setupGlobalResizeObserverErrorHandler();
    return () => {
      // No-op cleanup; the handler is lightweight and global
    };
  }, []);

	// This component renders nothing
	return null;
}


