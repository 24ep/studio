import type { SidebarNavGroup, SidebarNavItem } from './SidebarNavConfig';

export type SidebarPermissionPredicate = (item: SidebarNavItem) => boolean;

type SidebarGroupIdentity = Pick<SidebarNavGroup, "id" | "label">;

function normalizeGroupValue(value: string | undefined) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isSettingsGroup(group: SidebarGroupIdentity | undefined) {
  if (!group) return false;
  return group.id === "admin-center" || ["admin-center", "admin", "settings"].includes(normalizeGroupValue(group.label));
}

function isJobPortalGroup(group: SidebarGroupIdentity | undefined) {
  if (!group) return false;
  return group.id === "job-portal" || normalizeGroupValue(group.label) === "job-portal";
}

function findGroup(filteredGroups: SidebarNavGroup[], activeGroupIdentifier: string | undefined) {
  if (!activeGroupIdentifier) return undefined;
  const normalizedTarget = normalizeGroupValue(activeGroupIdentifier);

  return filteredGroups.find((group) => (
    normalizeGroupValue(group.id) === normalizedTarget ||
    normalizeGroupValue(group.label) === normalizedTarget
  ));
}

export function buildFilteredSidebarGroups(
  groups: SidebarNavGroup[],
  canShowItem: SidebarPermissionPredicate
) {
  return groups
    .map(group => ({
      ...group,
      items: group.items.filter(canShowItem),
    }))
    .filter(group => group.items.length > 0);
}

export function isSidebarItemActive(pathname: string, item: Pick<SidebarNavItem, 'href' | 'exact'>) {
  const currentPathname = stripHrefState(pathname);
  const itemPathname = stripHrefState(item.href);

  if (item.href.includes('?')) {
    const legacyAdminCenterTarget = pathname === '/settings?adminTab=app-api'
      ? '/settings?adminTab=integrations-api'
      : ['/settings?adminTab=feature-flags', '/settings?adminTab=security'].includes(pathname)
        ? '/settings?adminTab=security-governance'
        : null;
    if (legacyAdminCenterTarget === item.href) {
      return true;
    }

    const currentUrl = new URL(pathname, 'https://admin.local');
    const itemUrl = new URL(item.href, 'https://admin.local');
    const itemAdminTab = itemUrl.searchParams.get('adminTab');
    if (
      currentUrl.pathname === itemUrl.pathname
      && itemAdminTab !== null
      && currentUrl.searchParams.get('adminTab') === itemAdminTab
    ) {
      return true;
    }

    return pathname === item.href;
  }
  if (item.exact) {
    if (currentPathname !== itemPathname) return false;
    if (itemPathname === '/settings') {
      const adminTab = new URL(pathname, 'https://admin.local').searchParams.get('adminTab');
      return adminTab === null || adminTab === 'hr-setup';
    }
    return true;
  }
  if (itemPathname === '/') return currentPathname === '/';

  return currentPathname === itemPathname || currentPathname.startsWith(`${itemPathname}/`);
}

function stripHrefState(href: string) {
  return href.split(/[?#]/)[0];
}

export function getInitialSidebarActiveGroupLabel(
  pathname: string,
  filteredGroups: SidebarNavGroup[],
  t: (key: string, fallback: string) => string = (_, fallback) => fallback,
) {
  const settingsGroup = filteredGroups.find(group => isSettingsGroup(group));

  if (pathname === '/settings') return settingsGroup?.label || t('sidebar.group.settings', 'Settings');

  for (const group of filteredGroups) {
    if (group.items.some(item => isSidebarItemActive(pathname, item))) {
      return group.label;
    }
  }

  if (pathname.startsWith('/settings')) {
    if (settingsGroup) return settingsGroup.label;
  }

  return filteredGroups[0]?.label;
}

export function getDisplayedSidebarGroupLabel(
  hoveredGroupLabel: string | undefined,
  activeGroupLabel: string | undefined
) {
  return hoveredGroupLabel || activeGroupLabel;
}

export function getActiveSidebarGroup(
  filteredGroups: SidebarNavGroup[],
  displayedGroupLabel: string | undefined
) {
  return findGroup(filteredGroups, displayedGroupLabel) || filteredGroups[0];
}

export function shouldShowSidebarMenuPanel(
  pathname: string,
  activeGroupLabel?: string,
  activeGroupId?: string,
) {
  if (pathname === '/') return false;
  if (pathname === '/settings' && !activeGroupLabel && !activeGroupId) return false;
  if (isJobPortalGroup({ id: activeGroupId || "", label: activeGroupLabel || "" })) return false;
  if (activeGroupLabel && normalizeGroupValue(activeGroupLabel) === "job-portal") return false;
  return !!activeGroupLabel || !!activeGroupId;
}

export function getSidebarGroupFirstHref(group: SidebarNavGroup | undefined) {
  return group?.items[0]?.href;
}

export function buildSplitSidebarGroups(filteredGroups: SidebarNavGroup[]) {
  return filteredGroups;
}

export interface SidebarMenuSection {
  label: string;
  items: SidebarNavItem[];
}

export function buildSidebarMenuSections(activeGroup: SidebarNavGroup): SidebarMenuSection[] {
  return activeGroup.items.reduce<SidebarMenuSection[]>((sections, item) => {
    const sectionLabel = item.section || activeGroup.label;
    const existingSection = sections.find(section => section.label === sectionLabel);

    if (existingSection) {
      existingSection.items.push(item);
      return sections;
    }

    sections.push({ label: sectionLabel, items: [item] });
    return sections;
  }, []);
}

export function shouldShowSidebarSectionLabel(
  activeGroupLabel: string | undefined,
  activeGroupIdOrSectionLabel: string | undefined,
  sectionLabelOrGroupLabel: string,
  groupLabel?: string
) {
  const activeGroupId = groupLabel === undefined ? undefined : activeGroupIdOrSectionLabel;
  const sectionLabel = groupLabel === undefined
    ? activeGroupIdOrSectionLabel
    : sectionLabelOrGroupLabel;
  const resolvedGroupLabel = groupLabel ?? sectionLabelOrGroupLabel;

  return isSettingsGroup({ id: activeGroupId || "", label: activeGroupLabel || "" }) || sectionLabel !== resolvedGroupLabel;
}

export function getSidebarSectionClassName(sectionIndex: number) {
  return sectionIndex > 0 ? 'mt-5 pt-5 border-t border-gray-200/60 dark:border-zinc-800/60' : undefined;
}

export function shouldShowProcessQueueBadge(item: Pick<SidebarNavItem, 'href'>, pendingCount: number | null) {
  return item.href === '/process-queue' && pendingCount !== null && pendingCount > 0;
}

export function formatProcessQueueBadgeCount(pendingCount: number | null) {
  if (pendingCount === null || pendingCount <= 0) return null;

  return pendingCount > 99 ? '99+' : pendingCount;
}

export function shouldShowAssignedPositionsSection({
  activeGroupLabel,
  activeGroupId,
  showAssignedPositions,
  hasPositions,
}: {
  activeGroupLabel: string | undefined;
  activeGroupId?: string;
  showAssignedPositions: unknown;
  hasPositions: boolean;
}) {
  return (activeGroupId === "positions" || normalizeGroupValue(activeGroupLabel) === "positions") &&
    !!showAssignedPositions && hasPositions;
}
