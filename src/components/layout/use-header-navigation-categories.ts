"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

import { useLocalization } from "@/contexts/LocalizationContext";
import { isAdminUser } from "@/lib/permissions";
import type { PlatformModuleId } from "@/lib/types";

import { sidebarConfig, type SidebarNavGroup, type SidebarNavItem } from "./SidebarNavConfig";
import {
  buildAdminCenterMegaMenuGroups,
  MEGA_MENU_CATEGORIES,
  slugHeaderNavigationText,
  type HeaderNavigationCategory,
} from "./header-navigation-config";
import { hasSidebarItemPermission } from "./safe-sidebar-permissions";
import { buildFilteredSidebarGroups } from "./safe-sidebar-nav-utils";
import { localizeSidebarText } from "./sidebar-localization";

function addDestination(items: SidebarNavItem[], item: SidebarNavItem, beforeLabel?: string) {
  if (items.some(existing => existing.href === item.href)) return items;
  if (!beforeLabel) return [...items, item];
  const index = items.findIndex(existing => existing.label === beforeLabel);
  if (index < 0) return [...items, item];
  return [...items.slice(0, index), item, ...items.slice(index)];
}

export function useCurrentHeaderHref(pathname: string) {
  const searchParams = useSearchParams();

  return React.useMemo(() => {
    const queryString = searchParams.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [pathname, searchParams]);
}

export function useHeaderNavigationCategories(): HeaderNavigationCategory[] {
  const { data: session, status } = useSession();
  const { t } = useLocalization();
  const isAdmin = isAdminUser(session?.user);
  const modulePermissions = React.useMemo(
    () => (session?.user?.modulePermissions ?? []) as PlatformModuleId[],
    [session?.user?.modulePermissions],
  );

  const groups = React.useMemo<SidebarNavGroup[]>(() => {
    if (status === "loading") return [];

    const canManagePayroll = isAdmin || modulePermissions.includes("HR_PAYROLL_MANAGE");
    const canExportPayroll = isAdmin || modulePermissions.includes("HR_PAYROLL_EXPORT");

    return buildFilteredSidebarGroups(
      sidebarConfig,
      item => hasSidebarItemPermission(item, isAdmin, modulePermissions, session?.user),
    ).map(group => {
      let items: SidebarNavItem[] = group.items.map<SidebarNavItem>(item => ({
        ...item,
        label: localizeSidebarText(t, "item", slugHeaderNavigationText(item.label), item.label),
        description: item.description
          ? localizeSidebarText(t, "description", slugHeaderNavigationText(item.label), item.description)
          : item.description,
      }));

      if (group.id === "ess") {
        items = addDestination(items, {
          label: t("navigation.myPayslips", "My Payslips"),
          icon: DocumentTextIcon,
          href: "/ess/payslips",
          description: t("navigation.myPayslipsDescription", "View released payroll statements and secure payslip PDFs"),
          section: "Employee service",
        }, "My Benefits");
      }

      if (group.id === "payroll") {
        if (canManagePayroll) {
          items = addDestination(items, {
            label: t("navigation.payrollInputs", "Inputs & Adjustments"),
            icon: AdjustmentsHorizontalIcon,
            href: "/payroll/inputs",
            description: t("navigation.payrollInputsDescription", "Create and approve one-time earnings, deductions, taxes, and corrections"),
            section: "Payroll",
            permissionId: "HR_PAYROLL_MANAGE",
          }, "Payslips");
        }
        if (canExportPayroll) {
          items = addDestination(items, {
            label: t("navigation.payrollOutputs", "Outputs"),
            icon: ArrowDownTrayIcon,
            href: "/payroll/outputs",
            description: t("navigation.payrollOutputsDescription", "Download controlled bank, accounting, PND.1, and SSO artifacts"),
            section: "Payroll",
            permissionId: "HR_PAYROLL_EXPORT",
          }, "Reports");
        }
      }

      return {
        ...group,
        label: localizeSidebarText(t, "group", group.id, group.label),
        items,
      };
    });
  }, [isAdmin, modulePermissions, session?.user, status, t]);

  return React.useMemo(
    () => MEGA_MENU_CATEGORIES
      .map(category => {
        const categoryGroups = category.groupIds.flatMap(groupId => {
          const group = groups.find(candidate => candidate.id === groupId);
          return group ? [group] : [];
        });

        return {
          label: category.label,
          description: category.description,
          groups: buildAdminCenterMegaMenuGroups(category.label, categoryGroups),
          items: categoryGroups.flatMap(group => group.items),
        };
      })
      .filter(category => category.groups.length > 0),
    [groups],
  );
}
