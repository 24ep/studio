"use client"
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Settings, UsersRound, Code2, ListOrdered, Palette, Zap, ListTodo, DatabaseZap, SlidersHorizontal, KanbanSquare, Settings2, UserCog, UploadCloud, Loader2 } from "lucide-react"; 
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar";

import { useSession } from "next-auth/react";
import type { PlatformModuleId } from '@/lib/types';


const dashboardNavItem = { href: "/", label: "Dashboard", icon: LayoutDashboard };
const myTaskBoardNavItem = { href: "/my-tasks", label: "My Task Board", icon: ListTodo };
const candidatesNavItem = { href: "/candidates", label: "Candidates", icon: Users };
const positionsNavItem = { href: "/positions", label: "Positions", icon: Briefcase };
const bulkUploadNavItem = { href: "/candidates/upload", label: "Bulk Upload", icon: UploadCloud };
const settingsNavItem = { href: "/settings", label: "Settings", icon: Settings };

const mainNavItems = [dashboardNavItem, myTaskBoardNavItem, candidatesNavItem, positionsNavItem, bulkUploadNavItem, settingsNavItem];

// Helper to get the most specific active menu item
function getActiveMenuItem(pathname: string, items: { href: string }[]): { href: string } | undefined {
  // Sort by href length descending to prioritize more specific paths
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  return sorted.find(item =>
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href + "/"))
  );
}

// Memoize SidebarNav to prevent unnecessary re-renders
const SidebarNavComponent = function SidebarNav() {
  const pathname = usePathname();
  const { data: session, status: sessionStatus } = useSession();
  const userRole = session?.user?.role;

  const [isClient, setIsClient] = React.useState(false);

  // Bulk upload pending count state
  const [pendingCount, setPendingCount] = React.useState<number | null>(null);
  const [pendingError, setPendingError] = React.useState(false);
  React.useEffect(() => {
    let ignore = false;
    async function fetchPending() {
      try {
        const res = await fetch("/api/upload-queue?limit=100");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const count = Array.isArray(data.data)
          ? data.data.filter((item: any) => item.status === "queued").length
          : 0;
        if (!ignore) {
          setPendingCount(count);
        }
      } catch (e) {
        if (!ignore) {
          setPendingError(true);
        }
      }
    }
    fetchPending();
    return () => { ignore = true; };
  }, []);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Only the most specific menu item should be active
  const activeMainNavItem = getActiveMenuItem(pathname, mainNavItems);
  const isMyTaskBoardActive = myTaskBoardNavItem.href === pathname || pathname.startsWith(myTaskBoardNavItem.href + "/");

  return (
    <SidebarMenu>
      {/* Group 1: Dashboard, My Task Board */}
      <SidebarGroupLabel>General</SidebarGroupLabel>
      <SidebarMenuItem key={dashboardNavItem.href}>
        <Link href={dashboardNavItem.href} passHref legacyBehavior>
          <SidebarMenuButton
            asChild
            isActive={activeMainNavItem && activeMainNavItem.href === dashboardNavItem.href}
            className="w-full justify-start"
            size="default"
            data-active={activeMainNavItem && activeMainNavItem.href === dashboardNavItem.href}
          >
            <a>
              <dashboardNavItem.icon className="h-5 w-5" />
              <span className="truncate">{dashboardNavItem.label}</span>
            </a>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
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
      {/* Group 2: Candidates, Positions */}
      <SidebarGroupLabel>Recruitment</SidebarGroupLabel>
      <SidebarMenuItem key={candidatesNavItem.href}>
        <Link href={candidatesNavItem.href} passHref legacyBehavior>
          <SidebarMenuButton
            asChild
            isActive={activeMainNavItem && activeMainNavItem.href === candidatesNavItem.href}
            className="w-full justify-start"
            size="default"
            data-active={activeMainNavItem && activeMainNavItem.href === candidatesNavItem.href}
          >
            <a>
              <candidatesNavItem.icon className="h-5 w-5" />
              <span className="truncate">{candidatesNavItem.label}</span>
            </a>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
      <SidebarMenuItem key={positionsNavItem.href}>
        <Link href={positionsNavItem.href} passHref legacyBehavior>
          <SidebarMenuButton
            asChild
            isActive={activeMainNavItem && activeMainNavItem.href === positionsNavItem.href}
            className="w-full justify-start"
            size="default"
            data-active={activeMainNavItem && activeMainNavItem.href === positionsNavItem.href}
          >
            <a>
              <positionsNavItem.icon className="h-5 w-5" />
              <span className="truncate">{positionsNavItem.label}</span>
            </a>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
      {/* Group 3: Bulk Upload */}
      <SidebarGroupLabel>Bulk Actions</SidebarGroupLabel>
      <SidebarMenuItem key={bulkUploadNavItem.href}>
        <Link href={bulkUploadNavItem.href} passHref legacyBehavior>
          <SidebarMenuButton
            asChild
            isActive={activeMainNavItem && activeMainNavItem.href === bulkUploadNavItem.href}
            className="w-full justify-start"
            size="default"
            data-active={activeMainNavItem && activeMainNavItem.href === bulkUploadNavItem.href}
          >
            <a className="flex items-center w-full">
              <bulkUploadNavItem.icon className="h-5 w-5" />
              <span className="truncate">{bulkUploadNavItem.label}</span>
              {pendingError ? (
                <SidebarMenuBadge className="ml-2 bg-gray-400 text-white">?</SidebarMenuBadge>
              ) : pendingCount === null ? (
                <SidebarMenuBadge className="ml-2 bg-yellow-100 text-yellow-700 flex items-center"><Loader2 className="animate-spin h-4 w-4 mr-1" />Loading</SidebarMenuBadge>
              ) : (
                <SidebarMenuBadge className="ml-2 bg-yellow-400 text-black">{pendingCount} Pending</SidebarMenuBadge>
              )}
            </a>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
      {/* Group 4: Settings */}
      <SidebarGroupLabel>System</SidebarGroupLabel>
      <SidebarMenuItem className="mt-auto">
        <Link href={settingsNavItem.href} passHref legacyBehavior>
          <SidebarMenuButton
            asChild
            isActive={pathname.startsWith(settingsNavItem.href)}
            className="w-full justify-start"
            size="default"
            data-active={pathname.startsWith(settingsNavItem.href)}
          >
            <a>
              <settingsNavItem.icon className="h-5 w-5" />
              <span className="truncate">{settingsNavItem.label}</span>
            </a>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const SidebarNav = React.memo(SidebarNavComponent);
export default SidebarNav;
