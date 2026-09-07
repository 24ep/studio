"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useHasAssignedPositions } from "@/hooks/use-has-assigned-positions";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import type { PlatformModuleId } from "@/lib/types";
import { sidebarConfigWithLearningManagement as sidebarConfig } from "./SidebarNavLearningConfig";
import type { AppLayoutContextualLogos } from "./app-layout-settings";
import { SidebarSinglePanel } from "./SidebarSinglePanel";
import { isAdminUser } from "@/lib/permissions";
import { hasSidebarItemPermission } from "./safe-sidebar-permissions";
import {
  buildFilteredSidebarGroups,
} from "./safe-sidebar-nav-utils";
import { usePendingCount } from "./use-pending-count";
import { useLocalization } from '@/contexts/LocalizationContext';
import { localizeSidebarText } from './sidebar-localization';

export { SidebarMenuPanel } from "./SidebarMenuPanel";
export { SidebarRail } from "./SidebarRail";
export { usePendingCount } from "./use-pending-count";

interface GroupedSidebarNavProps {
  appLogoUrl: string | null;
  contextualLogos: Partial<AppLayoutContextualLogos>;
  currentAppName: string;
  isLogoLoading: boolean;
  showLogoOnly: boolean;
  sidebarLogoSize: number;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const GroupedSidebarNav = React.memo(({
  appLogoUrl,
  contextualLogos,
  currentAppName,
  isLogoLoading,
  showLogoOnly,
  sidebarLogoSize,
}: GroupedSidebarNavProps) => {
  const pathname = usePathname() || "";
  const { data: session, status } = useSession();
  const { pendingCount } = usePendingCount();
  const { sidebar: sidebarPreferences } = useUserPreferences();
  const { hasPositions } = useHasAssignedPositions() as { hasPositions: boolean };
  const { t } = useLocalization();
  const isAdmin = isAdminUser(session?.user);

  const modulePermissions = (session?.user?.modulePermissions ?? []) as PlatformModuleId[];

  const filteredGroups = React.useMemo(() => {
    const groups = buildFilteredSidebarGroups(
      sidebarConfig,
      item => hasSidebarItemPermission(item, isAdmin, modulePermissions, session?.user)
    );
    return groups.map(group => ({
      ...group,
      id: group.id,
      label: localizeSidebarText(t, 'group', group.id, group.label),
      items: group.items.map(item => ({
      ...item,
        label: localizeSidebarText(t, 'item', slug(item.label), item.label),
        description: item.description
          ? localizeSidebarText(t, 'description', slug(item.label), item.description)
          : item.description,
        section: item.section
          ? localizeSidebarText(t, 'section', slug(item.section), item.section)
          : item.section,
      })),
    }));
  }, [isAdmin, modulePermissions, session?.user, t]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <SidebarSinglePanel
        appLogoUrl={appLogoUrl}
        contextualLogos={contextualLogos}
        currentAppName={currentAppName}
        filteredGroups={filteredGroups}
        hasPositions={hasPositions}
        isLogoLoading={isLogoLoading}
        pathname={pathname}
        t={t}
        pendingCount={pendingCount}
        showLogoOnly={showLogoOnly}
        sidebarLogoSize={sidebarLogoSize}
        sidebarPreferences={sidebarPreferences}
      />
    </div>
  );
});

GroupedSidebarNav.displayName = "GroupedSidebarNav";

export default GroupedSidebarNav;
