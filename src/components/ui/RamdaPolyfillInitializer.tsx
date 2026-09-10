"use client";

import { useEffect } from 'react';
import { initializeRamdaPolyfill } from '@/lib/ramda-polyfill';

export function RamdaPolyfillInitializer() {
  useEffect(() => {
    // Initialize the Ramda polyfill on the client side
    initializeRamdaPolyfill();
  }, []);

  // This component doesn't render anything
  return null;
}
