import { LayoutDashboard, Users, Briefcase, Settings, Palette, KanbanSquare, DatabaseZap, SlidersHorizontal, BellRing, UsersRound, Code2, ListOrdered, ShieldCheck, Zap, ListTodo, UploadCloud } from "lucide-react";

export interface SidebarNavItem {
  label: string;
  icon: any;
  href: string;
  adminOnly?: boolean;
}

export interface SidebarNavGroup {
  label: string;
  items: SidebarNavItem[];
}

export const sidebarConfig: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/" },
      { label: "Candidates", icon: Users, href: "/candidates" },
      { label: "Positions", icon: Briefcase, href: "/positions" },
      { label: "Bulk Upload", icon: UploadCloud, href: "/candidates/upload" },
    ],
  },
  {
    label: "Recruitment",
    items: [
      { label: "My Task Board", icon: ListTodo, href: "/my-tasks" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "System Settings", icon: Settings, href: "/settings/system-settings", adminOnly: true },
      { label: "Preferences", icon: Palette, href: "/settings/system-preferences", adminOnly: true },
      { label: "Recruitment Stages", icon: KanbanSquare, href: "/settings/stages", adminOnly: true },
      { label: "Data Model UI", icon: DatabaseZap, href: "/settings/data-models", adminOnly: true },
      { label: "Custom Fields", icon: SlidersHorizontal, href: "/settings/custom-fields", adminOnly: true },
      { label: "Notifications", icon: BellRing, href: "/settings/notifications", adminOnly: true },
      { label: "Users", icon: UsersRound, href: "/settings/users", adminOnly: true },
      { label: "User Groups", icon: ShieldCheck, href: "/settings/user-groups", adminOnly: true },
      { label: "API Docs", icon: Code2, href: "/settings/api-docs", adminOnly: true },
      { label: "Logs", icon: ListOrdered, href: "/settings/logs", adminOnly: true },
    ],
  },
]; 