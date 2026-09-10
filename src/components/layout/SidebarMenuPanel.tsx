"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { SidebarGroupLabel } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { AssignedPositionsSidebar } from "./AssignedPositionsSidebar";
import { OptimizedLink } from "./OptimizedLink";
import { useLocalization } from '@/contexts/LocalizationContext';
import type { SidebarNavGroup } from "./SidebarNavConfig";
import type { SidebarPreferences } from "@/hooks/use-user-preferences";
import {
  buildSidebarMenuSections,
  formatProcessQueueBadgeCount,
  getSidebarSectionClassName,
  isSidebarItemActive,
  shouldShowAssignedPositionsSection,
  shouldShowProcessQueueBadge,
  shouldShowSidebarSectionLabel,
} from "./safe-sidebar-nav-utils";

interface SidebarMenuPanelProps {
  activeGroup: SidebarNavGroup | undefined;
  pathname: string;
  pendingCount: number | null;
  sidebarPreferences: Partial<SidebarPreferences> | null | undefined;
  hasPositions: boolean;
  activeGroupLabel: string | undefined;
}

export const SidebarMenuPanel = React.memo(function SidebarMenuPanel({
  activeGroup,
  pathname,
  pendingCount,
  sidebarPreferences,
  hasPositions,
  activeGroupLabel,
}: SidebarMenuPanelProps) {
  const searchParams = useSearchParams();
  const { t } = useLocalization();
  const currentHrefState = React.useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);

  if (!activeGroup) return null;

  const sectionedItems = buildSidebarMenuSections(activeGroup);
  return (
    <aside
      data-sidebar="sidebar"
      data-sidebar-panel="secondary"
      className="relative hidden w-[240px] flex-shrink-0 overflow-hidden border-r border-sidebar-border bg-transparent font-sidebar text-sidebar-foreground shadow-sidebar [--secondary-sidebar-menu-gap:0.25rem] [--sidebar-icon-margin-right:0.75rem] lg:flex lg:flex-col"
    >
      <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-5">
        {sectionedItems.map((section, sectionIndex) => (
          <div key={section.label} className={cn(getSidebarSectionClassName(sectionIndex))}>
            {shouldShowSidebarSectionLabel(activeGroupLabel, activeGroup.id, section.label, activeGroup.label) && (
              <div className="px-3 pb-2">
                <SidebarGroupLabel className="h-auto px-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-sidebar-group-label-color">
                  {section.label}
                </SidebarGroupLabel>
              </div>
            )}

            <div className="space-y-[var(--secondary-sidebar-menu-gap)]">
              {section.items.map((item) => {
                const isActive = isSidebarItemActive(currentHrefState, item);

                return (
                  <React.Fragment key={item.href}>
                    <OptimizedLink href={item.href} className="block">
                      <span
                        data-sidebar="menu-button"
                        data-active={isActive}
                          className={cn(
                            "group flex w-full items-center rounded-[8px] px-3 py-2 text-[13px] font-medium leading-5 transition-colors duration-sidebar",
                            isActive
                              ? "bg-sidebar-menu-background-active text-sidebar-menu-color-active shadow-sidebar-active"
                              : "bg-sidebar-menu-background text-sidebar-menu-color hover:bg-sidebar-menu-background-hover hover:text-sidebar-menu-color-hover",
                          )}
                      >
                        <span
                          className={cn(
                            "mr-[var(--sidebar-icon-margin-right)] flex h-[var(--sidebar-icon-size)] w-[var(--sidebar-icon-size)] items-center justify-center transition-colors duration-sidebar group-hover:text-sidebar-icon-color-hover",
                            isActive ? "text-sidebar-icon-color-active" : "text-sidebar-icon-color",
                          )}
                        >
                          <item.icon className="h-[var(--sidebar-icon-size)] w-[var(--sidebar-icon-size)]" />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {shouldShowProcessQueueBadge(item, pendingCount) && (
                          <Badge
                            variant="destructive"
                            className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold shadow-sm"
                          >
                            {formatProcessQueueBadgeCount(pendingCount)}
                          </Badge>
                        )}
                      </span>
                    </OptimizedLink>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}

        {shouldShowAssignedPositionsSection({
          activeGroupLabel,
          activeGroupId: activeGroup.id,
          showAssignedPositions: sidebarPreferences?.showAssignedPositions,
          hasPositions,
        }) && (
          <div className="mt-sidebar-group border-t border-sidebar-border pt-sidebar-group">
            <h3 className="mb-3 px-sidebar-padding-x text-sidebar-group font-sidebar-group uppercase tracking-sidebar-group text-sidebar-group-label-color">
              {t("navigation.jobAssigned", "Job assigned")}
            </h3>
            <div className="px-1">
              <AssignedPositionsSidebar variant="compact" />
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
});
