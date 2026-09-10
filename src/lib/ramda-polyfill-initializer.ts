import { R } from './ramda-polyfill-core';
import type { RamdaFunction } from './ramda-polyfill-types';

export function initializeRamdaPolyfill(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.R ??= {};

  Object.entries(R).forEach(([key, implementation]) => {
    if (typeof window.R?.[key] !== 'function') {
      window.R![key] = implementation as RamdaFunction;
    }
  });
}
