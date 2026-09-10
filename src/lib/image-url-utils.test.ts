import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  addCacheBuster,
  convertMinIOUrlToSecureUrl,
  removeCacheBuster,
} from './image-url-utils';

describe('image-url-utils cache busting', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('adds a stable cache buster to URLs without one', () => {
    expect(addCacheBuster('/images/logo.png')).toBe('/images/logo.png?cb=1');
    expect(addCacheBuster('images/logo.png')).toBe('images/logo.png?cb=1');
    expect(addCacheBuster('https://example.com/logo.png?size=large')).toBe(
      'https://example.com/logo.png?size=large&cb=1'
    );
  });

  it('replaces cache busters with timestamp and crypto UUID when force refreshing', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123456);
    vi.stubGlobal('crypto', {
      randomUUID: () => '12345678-90ab-cdef-1234-567890abcdef',
    });

    expect(addCacheBuster('/images/logo.png?cb=1', true)).toBe('/images/logo.png?cb=123456-1234567890abc');
  });

  it('falls back to Math.random when crypto UUID is unavailable', () => {
    vi.spyOn(Date, 'now').mockReturnValue(987654);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    vi.stubGlobal('crypto', {});

    expect(addCacheBuster('/images/logo.png', true)).toBe('/images/logo.png?cb=987654-i');
  });

  it('removes cache busters without changing other params', () => {
    expect(removeCacheBuster('/images/logo.png?size=large&cb=1')).toBe('/images/logo.png?size=large');
    expect(removeCacheBuster('https://example.com/logo.png?cb=1')).toBe('https://example.com/logo.png');
  });

  it('converts MinIO bucket URLs to secure preview endpoints', () => {
    expect(convertMinIOUrlToSecureUrl('https://minio.local/studio-production/applicants/a.png')).toBe(
      '/api/secure-file/preview?filePath=applicants%2Fa.png'
    );
  });

  it('converts public logo paths to public endpoints and rejects dangerous protocols', () => {
    expect(convertMinIOUrlToSecureUrl(
      'https://minio.local/studio-production/settings/logo.png',
      { isPublic: true, thumbnail: true }
    )).toBe('http://localhost:8021/api/public/logo?filePath=settings%2Flogo.png&thumbnail=true');

    expect(convertMinIOUrlToSecureUrl(
      'https://minio.local/studio-production/Applicant-source-logo/source.png',
      { isPublic: true, width: 64, height: 32 }
    )).toBe('http://localhost:8021/api/public/logo?filePath=Applicant-source-logo%2Fsource.png&width=64&height=32');

    expect(convertMinIOUrlToSecureUrl(
      '/api/secure-file/preview?filePath=settings%2Flogo.png&width=48',
      { isPublic: true, height: 24 }
    )).toBe('http://localhost:8021/api/public/logo?filePath=settings%2Flogo.png&width=48&height=24');

    expect(convertMinIOUrlToSecureUrl('javascript:alert(1)')).toBeNull();
  });
});
