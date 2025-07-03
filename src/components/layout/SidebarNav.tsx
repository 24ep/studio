"use client"
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Settings, UsersRound, Code2, ListOrdered, Palette, Zap, ListTodo, DatabaseZap, SlidersHorizontal, KanbanSquare, Settings2, UserCog } from "lucide-react"; 
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



// Memoize SidebarNav to prevent unnecessary re-renders
const SidebarNavComponent = function SidebarNav() {
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const userRole = session?.user?.role;

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const isAnyMainNavItemActive = mainNavItems.some(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
  const isMyTaskBoardActive = myTaskBoardNavItem.href === pathname || pathname.startsWith(myTaskBoardNavItem.href + "/");


  return (
      <SidebarMenu>
        {mainNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                className="w-full justify-start"
                size="default"
                data-active={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
              >
                <a>
                  <item.icon className="h-5 w-5" />
                  <span className="truncate">{item.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}

        {isClient && (userRole === 'Recruiter' || userRole === 'Admin') && (
          <SidebarMenuItem key={myTaskBoardNavItem.href}>
            <Link href={myTaskBoardNavItem.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={isMyTaskBoardActive}
                className="w-full justify-start"
                size="default"
                data-active={isMyTaskBoardActive}
              >
                <a>
                  <myTaskBoardNavItem.icon className="h-5 w-5" />
                  <span className="truncate">{myTaskBoardNavItem.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        )}

        <SidebarMenuItem className="mt-auto">
          <Link href="/settings" passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/settings")}
              className="w-full justify-start"
              size="default"
              data-active={pathname.startsWith("/settings")}
            >
              <a>
                <Settings className="h-5 w-5" />
                <span className="truncate">Settings</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
  );
};

const SidebarNav = React.memo(SidebarNavComponent);
export default SidebarNav;
