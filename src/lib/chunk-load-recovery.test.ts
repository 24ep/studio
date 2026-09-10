import { describe, expect, it } from 'vitest';
import {
  isChunkLoadError,
  recoverFromChunkLoadError,
} from './chunk-load-recovery';

describe('chunk-load-recovery', () => {
  it('detects common chunk load failures', () => {
    expect(isChunkLoadError(new Error('Loading chunk 42 failed'))).toBe(true);
    expect(isChunkLoadError('Loading CSS chunk 7 failed')).toBe(true);
    expect(isChunkLoadError({ message: '/_next/static/chunks/app.js failed' })).toBe(true);
    expect(isChunkLoadError('Refused to execute script from /_next/static/css/app.css')).toBe(true);
    expect(isChunkLoadError('Minified React error #130; visit https://react.dev/errors/130?args[]=undefined&args[]=')).toBe(true);
    expect(isChunkLoadError(new Error('ordinary error'))).toBe(false);
  });

  it('does not recover outside a browser context', async () => {
    await expect(recoverFromChunkLoadError(new Error('Loading chunk 42 failed'))).resolves.toBe(false);
  });
});
