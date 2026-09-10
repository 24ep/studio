type LayoutTranslator = (key: string, fallback: string) => string;

export function getAppLayoutPageTitle(pathname: string | null, t: LayoutTranslator = (key, fallback) => fallback) {
  const pathSegments = getAppLayoutPathSegments(pathname);
  const lastSegment = pathSegments[pathSegments.length - 1];

  return pathSegments.length === 0
    ? t("appLayout.dashboard", "Dashboard")
    : (lastSegment ? formatPathSegmentTitle(lastSegment, t) : t("appLayout.page", "Page"));
}

export interface AppLayoutBreadcrumbItem {
  label: string;
  href: string;
}

export function getAppLayoutBreadcrumbItems(pathname: string | null, t: LayoutTranslator = (key, fallback) => fallback): AppLayoutBreadcrumbItem[] {
  const pathSegments = getAppLayoutPathSegments(pathname);

  if (pathSegments.length === 0) {
    return [{ label: t("appLayout.dashboard", "Dashboard"), href: '/' }];
  }

  return pathSegments.map((segment, index) => ({
    label: formatPathSegmentTitle(segment, t),
    href: `/${pathSegments.slice(0, index + 1).join('/')}`,
  }));
}

function getAppLayoutPathSegments(pathname: string | null) {
  return (pathname || '')
    .split('?')[0]
    .split('#')[0]
    .split('/')
    .filter(Boolean);
}

function formatPathSegmentTitle(segment: string, t: LayoutTranslator = (key, fallback) => fallback) {
  if (isOpaqueRouteSegment(segment)) {
    return t("appLayout.path.detail", "Detail");
  }

  const label = segment
    .split(/[-_]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return t(`appLayout.path.${segment.toLowerCase().replace(/[^a-z0-9]+/g, ".")}`, label);
}

function isOpaqueRouteSegment(segment: string) {
  return /^[0-9a-f]{8}-[0-9a-f-]{13,}$/i.test(segment) || /^[0-9a-f]{16,}$/i.test(segment);
}
