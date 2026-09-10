export interface ParsedImageUrl {
  urlObj: URL;
  isRelative: boolean;
}

export function getImageUrlBase() {
  return typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXTAUTH_URL || 'http://localhost:8021';
}

export function parseImageUrlSafe(url: string): ParsedImageUrl | null {
  if (!url) return null;

  const isRelative = !url.startsWith('http:') && !url.startsWith('https:') && !url.startsWith('//');
  try {
    const urlObj = new URL(url, isRelative ? getImageUrlBase() : undefined);
    return { urlObj, isRelative };
  } catch {
    return null;
  }
}

export function serializeParsedImageUrl(originalUrl: string, parsed: ParsedImageUrl) {
  if (!parsed.isRelative) {
    return parsed.urlObj.toString();
  }

  const result = parsed.urlObj.pathname + parsed.urlObj.search + parsed.urlObj.hash;
  return !originalUrl.startsWith('/') && result.startsWith('/')
    ? result.substring(1)
    : result;
}
