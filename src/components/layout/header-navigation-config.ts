import type { SidebarNavGroup, SidebarNavItem } from "./SidebarNavConfig";

export const MEGA_MENU_CATEGORIES = [
  { label: "Home", description: "Daily workspace and employee portal", groupIds: ["employee-portal"] },
  { label: "People", description: "Employee records, organization, contracts, and lifecycle", groupIds: ["people"] },
  { label: "ESS", description: "Personal profile, attendance, leave, documents, benefits, and employee requests", groupIds: ["ess"] },
  { label: "Workforce", description: "Attendance, timesheets, rosters, overtime, shifts, and transportation", groupIds: ["workforce"] },
  { label: "Leave", description: "Leave operations, allocations, policy assignment, approvals, and encashment", groupIds: ["leaves"] },
  { label: "Pay", description: "Payroll, compensation, benefits, and expenses", groupIds: ["payroll", "expenses"] },
  { label: "Hiring", description: "Recruitment and the candidate-facing portal", groupIds: ["recruitment", "job-portal"] },
  { label: "Growth", description: "Performance, learning, development, and recognition", groupIds: ["performance", "learning"] },
  { label: "Admin", description: "Organization setup, analytics, communications, integrations, and platform controls", groupIds: ["admin-center", "data-and-analytics", "broadcast", "privacy-support", "client", "other"] },
] as const;

export interface HeaderNavigationCategory {
  label: string;
  description: string;
  groups: SidebarNavGroup[];
  items: SidebarNavItem[];
}

export function slugHeaderNavigationText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getCategoryFirstHref(
  category: Pick<HeaderNavigationCategory, "label" | "items">,
) {
  const firstItemHref = category.items.find(item => Boolean(item.href))?.href;
  if (!firstItemHref) return undefined;
  if (category.label === "Home") return firstItemHref;
  return category.items.find(item => item.href !== "/employee-portal")?.href ?? firstItemHref;
}

export function buildAdminCenterMegaMenuGroups(
  categoryLabel: string,
  groups: SidebarNavGroup[],
): SidebarNavGroup[] {
  if (categoryLabel !== "Admin" || groups.length === 0) return groups;

  const adminGroup = groups.find(group => group.id === "admin-center");
  if (!adminGroup) return groups;

  const otherGroups = groups.filter(group => group.id !== "admin-center");
  const adminColumns = [
    { id: "admin-essentials", label: "Workspace", items: adminGroup.items.slice(0, 5) },
    { id: "admin-controls", label: "Platform controls", items: adminGroup.items.slice(5, 10) },
    { id: "admin-oversight", label: "Integrations & oversight", items: adminGroup.items.slice(10) },
  ]
    .filter(column => column.items.length > 0)
    .map(column => ({
      ...adminGroup,
      id: column.id,
      label: column.label,
      icon: column.items[0]?.icon ?? adminGroup.icon,
      items: column.items,
    }));

  return [...adminColumns, ...otherGroups];
}
