export function hasDangerousImageProtocol(url: string) {
  const lowerUrl = url.trim().toLowerCase();
  return ['javascript:', 'vbscript:', 'data:text/html'].some(protocol => lowerUrl.startsWith(protocol));
}
