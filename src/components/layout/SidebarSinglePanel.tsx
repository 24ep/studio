"use client";

import * as React from "react";
import {
  ChevronDownIcon as ChevronDown,
} from "@heroicons/react/24/outline";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import type { SidebarPreferences } from "@/hooks/use-user-preferences";
import type { AppLayoutContextualLogos } from "./app-layout-settings";
import { getFigmaSidebarLogoDisplaySize } from "./figma-sidebar-logo-size";
import { OptimizedLink } from "./OptimizedLink";
import type { SidebarNavGroup, SidebarNavIcon, SidebarNavItem } from "./SidebarNavConfig";
import { SidebarHeaderLogo } from "./SidebarHeaderLogo";
import {
  formatProcessQueueBadgeCount,
  isSidebarItemActive,
  shouldShowProcessQueueBadge,
} from "./safe-sidebar-nav-utils";

interface SidebarSinglePanelProps {
  appLogoUrl: string | null;
  contextualLogos: Partial<AppLayoutContextualLogos>;
  currentAppName: string;
  filteredGroups: SidebarNavGroup[];
  hasPositions: boolean;
  isLogoLoading: boolean;
  pathname: string;
  pendingCount: number | null;
  showLogoOnly: boolean;
  sidebarLogoSize: number;
  sidebarPreferences: Partial<SidebarPreferences> | null | undefined;
  t: (key: string, fallback?: string) => string;
}

export const SidebarSinglePanel = React.memo(function SidebarSinglePanel({
  appLogoUrl,
  contextualLogos,
  currentAppName,
  filteredGroups,
  isLogoLoading,
  pathname,
  pendingCount,
  showLogoOnly,
  sidebarLogoSize,
  t,
  sidebarPreferences,
}: SidebarSinglePanelProps) {
  const { currentTheme, mounted } = useTheme();
  const searchParams = useSearchParams();
  const currentHrefState = React.useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);
  const figmaSections = React.useMemo(
    () => buildFigmaSidebarSections(filteredGroups, t),
    [filteredGroups, t],
  );
  const displayedLogoSize = getFigmaSidebarLogoDisplaySize(sidebarLogoSize);
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    const activeParentLabels = getActiveParentLabels(figmaSections, currentHrefState);
    if (activeParentLabels.length === 0) return;

    setOpenGroups(new Set([activeParentLabels[0]]));
  }, [currentHrefState, figmaSections]);

  const toggleGroup = React.useCallback((label: string) => {
    setOpenGroups((current) => {
      if (current.has(label)) {
        return new Set();
      }

      return new Set([label]);
    });
  }, []);

  return (
    <aside
      data-sidebar="sidebar"
      data-sidebar-variant="figma-single-panel"
      className="z-30 hidden h-full w-[240px] flex-shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground font-sidebar shadow-none lg:flex"
    >
      <div className="relative flex h-[49px] shrink-0 items-center gap-2 px-3 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-sidebar-border after:content-['']">
        <div
          className="grid shrink-0 place-items-center overflow-hidden rounded-[4px] text-sidebar-icon-color"
          style={{
            height: displayedLogoSize,
            width: displayedLogoSize,
          }}
        >
          <SidebarHeaderLogo
            appLogoUrl={appLogoUrl}
            collapsedSidebarLogoSize={displayedLogoSize}
            contextualLogos={contextualLogos}
            isClient={mounted}
            isCollapsed={false}
            isDarkMode={currentTheme === "dark"}
            isLogoLoading={isLogoLoading}
            sidebarLogoSize={displayedLogoSize}
          />
        </div>
        {!showLogoOnly && (
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold leading-[14px] tracking-normal text-sidebar-foreground">
              {currentAppName}
            </p>
            <p className="truncate text-[8px] font-medium uppercase leading-[10px] tracking-[0.08em] text-sidebar-group-label-color">
              {t("brand.platform", "HRIS Platform")}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 pt-4 [scrollbar-color:#46536d_transparent] [scrollbar-width:thin]">
        {figmaSections.map((section) => (
          <section key={section.label} className="mb-[14px] last:mb-0">
            <h2 className="mb-1 px-1 text-left text-[8px] font-semibold uppercase leading-3 tracking-[0.16em] text-sidebar-group-label-color">
              {section.label}
            </h2>
            <div className="space-y-0">
              {section.entries.map((entry) => (
                <FigmaSidebarEntry
                  key={`${section.label}-${entry.label}`}
                  entry={entry}
                  open={openGroups.has(entry.label)}
                  currentHrefState={currentHrefState}
                  pendingCount={pendingCount}
                  onToggle={() => toggleGroup(entry.label)}
                />
              ))}
            </div>
          </section>
        ))}
      </nav>

      <footer className="shrink-0 border-t border-sidebar-border px-3 py-3 text-[9px] font-medium leading-3 text-sidebar-group-label-color">
        {`© ${t("labels.yearSuffix", "2024")} ${t("brand.subtitle", "outbound corp")}`}
      </footer>
    </aside>
  );
});

interface FigmaSidebarSection {
  id: string;
  label: string;
  entries: FigmaSidebarEntryDefinition[];
}

type FigmaSidebarEntryDefinition = FigmaSidebarLeafEntry | FigmaSidebarGroupEntry;
type FigmaSidebarMenuIcon = SidebarNavIcon;

interface FigmaSidebarLeafEntry {
  type: "leaf";
  label: string;
  icon: FigmaSidebarMenuIcon;
  item: SidebarNavItem;
}

interface FigmaSidebarGroupEntry {
  type: "group";
  label: string;
  icon: FigmaSidebarMenuIcon;
  children: Array<{
    label: string;
    item: SidebarNavItem;
  }>;
}

function FigmaSidebarEntry({
  entry,
  open,
  currentHrefState,
  pendingCount,
  onToggle,
}: {
  entry: FigmaSidebarEntryDefinition;
  open: boolean;
  currentHrefState: string;
  pendingCount: number | null;
  onToggle: () => void;
}) {
  if (entry.type === "leaf") {
    const isActive = isFigmaSidebarItemActive(currentHrefState, entry.item);

    return (
      <OptimizedLink href={entry.item.href} className="block">
        <span className={getFigmaSidebarRowClassName(isActive)}>
          <entry.icon className="h-4 w-4 shrink-0 stroke-[1.6]" />
          <span className="min-w-0 flex-1 truncate text-left">{entry.label}</span>
          {shouldShowProcessQueueBadge(entry.item, pendingCount) && <FigmaSidebarBadge pendingCount={pendingCount} />}
        </span>
      </OptimizedLink>
    );
  }

  const parentActive = entry.children.some(child => isFigmaSidebarItemActive(currentHrefState, child.item));

  return (
    <div>
      <button
        type="button"
        className={getFigmaSidebarRowClassName(parentActive)}
        onClick={onToggle}
        aria-expanded={open}
      >
        <entry.icon className="h-4 w-4 shrink-0 stroke-[1.6]" />
        <span className="min-w-0 flex-1 truncate text-left">{entry.label}</span>
        <ChevronDown
          className={cn(
            "h-2.5 w-2.5 shrink-0 scale-[0.65] stroke-[1.6] text-sidebar-icon-color transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="relative mt-1 space-y-0">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-1 left-[19px] top-1 z-10 w-px bg-sidebar-border"
          />
          {entry.children.map((child) => {
            const childActive = isFigmaSidebarItemActive(currentHrefState, child.item);

            return (
              <OptimizedLink key={`${entry.label}-${child.label}`} href={child.item.href} className="block">
                <span
                  className={cn(
                    "relative ml-7 flex h-[28px] items-center truncate rounded-[4px] pl-2 pr-2 text-left text-[11px] font-normal leading-4 tracking-normal transition-colors",
                    childActive
                      ? "bg-sidebar-menu-item-background-active text-sidebar-menu-item-color-active"
                      : "text-sidebar-menu-item-color hover:bg-sidebar-menu-item-background-hover hover:text-sidebar-menu-item-color-hover",
                  )}
                  title={child.label}
                >
                  {child.label}
                </span>
              </OptimizedLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getFigmaSidebarRowClassName(isActive: boolean) {
  return cn(
    "flex h-[30px] w-full items-center gap-2 rounded-[4px] px-2 text-left text-[11px] font-medium leading-4 tracking-normal transition-colors",
    isActive
      ? "bg-sidebar-menu-item-background-active text-sidebar-menu-item-color-active"
      : "text-sidebar-menu-item-color hover:bg-sidebar-menu-item-background-hover hover:text-sidebar-menu-item-color-hover",
  );
}

function FigmaSidebarBadge({ pendingCount }: { pendingCount: number | null }) {
  return (
    <Badge
      variant="destructive"
      className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
    >
      {formatProcessQueueBadgeCount(pendingCount)}
    </Badge>
  );
}

export function buildFigmaSidebarSections(
  filteredGroups: SidebarNavGroup[],
  t: (key: string, fallback?: string) => string = (_, fallback) => fallback || "",
): FigmaSidebarSection[] {
  const sectionOrder = ["MAIN", "WORKFORCE", "PEOPLE", "FINANCE", "OTHER", "SYSTEM"] as const;
  const sectionDefaults: Record<(typeof sectionOrder)[number], string> = {
    MAIN: "Main",
    WORKFORCE: "Workforce",
    PEOPLE: "People",
    FINANCE: "Finance",
    OTHER: "Other",
    SYSTEM: "System",
  };
  const sectionByGroupId: Record<string, (typeof sectionOrder)[number]> = {
    "employee-portal": "MAIN",
    recruitment: "WORKFORCE",
    client: "OTHER",
    people: "WORKFORCE",
    workforce: "WORKFORCE",
    performance: "WORKFORCE",
    leaves: "WORKFORCE",
    "data-and-analytics": "OTHER",
    learning: "PEOPLE",
    "job-portal": "OTHER",
    payroll: "FINANCE",
    expenses: "FINANCE",
    ess: "PEOPLE",
    broadcast: "PEOPLE",
    "admin-center": "SYSTEM",
    other: "OTHER",
    "privacy-support": "SYSTEM",
  };
  const groupDisplayLabels: Record<string, string> = {
    recruitment: t("sidebar.group.recruitment", "Recruit"),
    people: t("sidebar.group.people", "Employee"),
    workforce: t("sidebar.group.workforce", "Employee"),
    performance: t("sidebar.group.people", "Employee"),
  };
  const resolveSectionLabel = (sectionId: (typeof sectionOrder)[number]) => {
    const canonicalKey = `sidebar.section.${sectionId.toLowerCase()}`;
    const legacyKey = `sidebar.section.${sectionId}`;
    const canonicalLabel = t(canonicalKey, canonicalKey);

    if (canonicalLabel !== canonicalKey) return canonicalLabel;

    const legacyLabel = t(legacyKey, legacyKey);
    if (legacyLabel !== legacyKey) return legacyLabel;

    return sectionDefaults[sectionId];
  };

  const sections = new Map<string, FigmaSidebarSection>(
    sectionOrder.map((id) => ({
      id,
      label: resolveSectionLabel(id),
      entries: [],
    })).map((section) => [section.id, section]),
  );

  filteredGroups.forEach((group) => {
    const section = sections.get(sectionByGroupId[group.id] || "OTHER");
    if (!section || group.items.length === 0) return;

    if (group.id === "employee-portal" || group.id === "job-portal" || group.id === "client" || group.id === "other") {
      section.entries.push(...group.items.map(item => ({
        type: "leaf" as const,
        label: item.label,
        icon: item.icon,
        item,
      })));
      return;
    }

    const displayLabel = groupDisplayLabels[group.id] || group.label;
    const existingGroup = section.entries.find(
      (entry): entry is FigmaSidebarGroupEntry => entry.type === "group" && entry.label === displayLabel,
    );
    if (existingGroup) {
      existingGroup.children.push(...group.items.map(item => ({ label: item.label, item })));
      return;
    }

    section.entries.push({
      type: "group",
      label: displayLabel,
      icon: group.icon,
      children: group.items.map(item => ({ label: item.label, item })),
    });
  });

  return sectionOrder
    .map((id) => sections.get(id)!)
    .filter((section) => section.entries.length > 0);
}

function getActiveParentLabels(sections: FigmaSidebarSection[], currentHrefState: string) {
  return sections.flatMap(section =>
    section.entries.flatMap(entry => (
      entry.type === "group" && entry.children.some(child => isFigmaSidebarItemActive(currentHrefState, child.item))
        ? [entry.label]
        : []
    )),
  );
}

export function isFigmaSidebarItemActive(currentHrefState: string, item: SidebarNavItem) {
  const currentPathname = stripHrefState(currentHrefState);
  const itemPathname = stripHrefState(item.href);

  if (item.href.includes("?")) {
    const legacyAdminCenterTarget = currentHrefState === "/settings?adminTab=app-api"
      ? "/settings?adminTab=integrations-api"
      : ["/settings?adminTab=feature-flags", "/settings?adminTab=security"].includes(currentHrefState)
        ? "/settings?adminTab=security-governance"
        : null;
    if (legacyAdminCenterTarget === item.href) {
      return true;
    }

    if (item.href === "/workforce/attendance?view=attendance" && currentPathname === "/workforce/attendance" && !currentHrefState.includes("?")) {
      return true;
    }

    const currentUrl = new URL(currentHrefState, "https://admin.local");
    const itemUrl = new URL(item.href, "https://admin.local");
    const itemAdminTab = itemUrl.searchParams.get("adminTab");
    if (
      currentUrl.pathname === itemUrl.pathname
      && itemAdminTab !== null
      && currentUrl.searchParams.get("adminTab") === itemAdminTab
    ) {
      return true;
    }

    return currentHrefState === item.href;
  }

  if (currentHrefState.includes("?") && currentPathname === itemPathname) {
    return false;
  }

  return isSidebarItemActive(currentPathname, {
    ...item,
    href: itemPathname,
  });
}

function stripHrefState(href: string) {
  return href.split(/[?#]/)[0];
}
