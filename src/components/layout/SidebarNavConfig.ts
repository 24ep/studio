import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings, 
  ListTodo, 
  UploadCloud,
  FileText,
  BarChart3,
  Calendar,
  MessageSquare,
  Shield,
  Database,
  Zap,
  Target
} from "lucide-react";

export interface SidebarNavItem {
  label: string;
  icon: any;
  href: string;
  adminOnly?: boolean;
  badge?: string;
  description?: string;
}

export interface SidebarNavGroup {
  label: string;
  items: SidebarNavItem[];
}

export const sidebarConfig: SidebarNavGroup[] = [
  {
    label: "Overview",
    items: [
      { 
        label: "Dashboard", 
        icon: LayoutDashboard, 
        href: "/",
        description: "Overview and analytics"
      },
      { 
        label: "Candidates", 
        icon: Users, 
        href: "/candidates",
        description: "Manage candidate profiles"
      },
      { 
        label: "Positions", 
        icon: Briefcase, 
        href: "/positions",
        description: "Job positions and openings"
      },
      { 
        label: "Bulk Upload", 
        icon: UploadCloud, 
        href: "/candidates/upload",
        description: "Import candidates in bulk"
      },
    ],
  },
  {
    label: "Recruitment",
    items: [
      { 
        label: "My Task Board", 
        icon: ListTodo, 
        href: "/my-tasks",
        description: "Personal task management"
      },
    ],
  },
  {
    label: "System",
    items: [
      { 
        label: "Settings", 
        icon: Settings, 
        href: "/settings",
        description: "System configuration"
      },
    ],
  },
]; 