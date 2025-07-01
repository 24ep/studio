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
    label: "Settings",
    items: [
      { label: "Settings", icon: Settings, href: "/settings" },
    ],
  },
]; 