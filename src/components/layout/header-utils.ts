export function shouldShowMobileSearchButton(pathname?: string | null) {
  if (!pathname) {
    return false;
  }

  const normalizedPathname = pathname.toLowerCase();
  return ['/applicants', '/positions'].includes(normalizedPathname);
}

export function getMobileSearchEventName(pathname?: string | null) {
  if (!pathname) {
    return null;
  }

  const normalizedPathname = pathname.toLowerCase();
  if (normalizedPathname.startsWith('/applicants')) {
    return 'applicants:toggle-mobile-search';
  }
  if (normalizedPathname.startsWith('/positions')) {
    return 'positions:toggle-mobile-search';
  }
  return null;
}

export function isHeaderHiddenOnMobileDetail(pathname?: string | null) {
  if (!pathname) {
    return false;
  }

  const parts = pathname.split('/').filter(Boolean);
  const isApplicantDetail = parts[0]?.toLowerCase() === 'applicants' && parts.length >= 2;
  const isPositionDetail = parts[0] === 'positions' && parts.length >= 2;

  return isApplicantDetail || isPositionDetail;
}
