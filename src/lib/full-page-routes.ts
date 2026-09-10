export function isPolicyDocumentEditorPath(pathname: string | null | undefined): boolean {
  return Boolean(pathname && /^\/policy-documents\/[^/]+\/?$/i.test(pathname));
}

export function isFullPageWorkspacePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;

  return isPolicyDocumentEditorPath(pathname)
    || pathname === '/apply'
    || pathname.startsWith('/apply/')
    || pathname === '/offer'
    || pathname.startsWith('/offer/');
}
