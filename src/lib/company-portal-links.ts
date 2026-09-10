export function resolveCompanyPortalLinkAnchor(value: string) {
  const anchor = value.trim();
  const opensNewTab = /^https?:\/\//i.test(anchor);
  const isSafe = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(anchor);

  return {
    href: isSafe ? anchor : '#',
    opensNewTab,
  };
}
