
"use client"
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Settings, UsersRound, Code2, ListOrdered, Palette, Zap, ListTodo, DatabaseZap, SlidersHorizontal, KanbanSquare, Settings2 as CustomFieldsIcon, BellRing, ShieldCheck } from "lucide-react"; 
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import type { PlatformModuleId } from '@/lib/types';


const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/positions", label: "Positions", icon: Briefcase },
];

const myTaskBoardNavItem = { href: "/my-tasks", label: "My Task Board", icon: ListTodo };

const settingsNavItem = { href: "/settings/preferences", label: "Settings", icon: Settings }; // Points to default settings page

export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState, isMobile } = useSidebar();
  const { data: session, status: sessionStatus } = useSession();
  const userRole = session?.user?.role;
  const modulePermissions = session?.user?.modulePermissions || [];

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const canAccessMyTasks = isClient && (userRole === 'Recruiter' || userRole === 'Admin' || modulePermissions.includes('CANDIDATES_VIEW'));
  const canAccessSettings = isClient && (
    userRole === 'Admin' || 
    modulePermissions.some(p => 
        p.startsWith('SYSTEM_SETTINGS_') || 
        p.startsWith('USER_PREFERENCES_') ||
        p.startsWith('RECRUITMENT_STAGES_') ||
        p.startsWith('CUSTOM_FIELDS_') ||
        p.startsWith('WEBHOOK_MAPPING_') ||
        p.startsWith('NOTIFICATION_SETTINGS_') ||
        p.startsWith('USER_GROUPS_') ||
        p.startsWith('USERS_') || // USERS_MANAGE
        p.startsWith('LOGS_') // LOGS_VIEW
    ) ||
    // Explicitly allow for API Docs as it doesn't have a specific permission yet
    pathname.startsWith("/settings/api-docs")
  );


  return (
      <SidebarMenu>
        {mainNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                className="w-full justify-start"
                tooltip={item.label}
                size="default"
                data-active={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
              >
                <a> <item.icon className="h-5 w-5" /> <span className="truncate">{item.label}</span> </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}

        {isClient && canAccessMyTasks && (
          <SidebarMenuItem key={myTaskBoardNavItem.href}>
            <Link href={myTaskBoardNavItem.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(myTaskBoardNavItem.href)}
                className="w-full justify-start"
                tooltip={myTaskBoardNavItem.label}
                size="default"
                data-active={pathname.startsWith(myTaskBoardNavItem.href)}
              >
                <a> <myTaskBoardNavItem.icon className="h-5 w-5" /> <span className="truncate">{myTaskBoardNavItem.label}</span> </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        )}

        {isClient && canAccessSettings && (
           <SidebarMenuItem key={settingsNavItem.href}>
             <Link href={settingsNavItem.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/settings")}
                  className="w-full justify-start"
                  tooltip={settingsNavItem.label}
                  size="default"
                  data-active={pathname.startsWith("/settings")}
                >
                    <a> <settingsNavItem.icon className="h-5 w-5" /> <span className="truncate">{settingsNavItem.label}</span> </a>
                </SidebarMenuButton>
             </Link>
           </SidebarMenuItem>
        )}
      </SidebarMenu>
  );
}
