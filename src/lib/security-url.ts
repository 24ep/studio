const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];
const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'data:text/html'];

export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';

  if (url.startsWith('/') || url.startsWith('#') || url.startsWith('?')) {
    return url;
  }

  if (url.trim().toLowerCase().startsWith('data:image/')) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);
    return SAFE_PROTOCOLS.includes(parsedUrl.protocol) ? url : '';
  } catch {
    const lowerUrl = url.trim().toLowerCase();
    if (DANGEROUS_PROTOCOLS.some((protocol) => lowerUrl.startsWith(protocol))) {
      return '';
    }

    return '';
  }
}
