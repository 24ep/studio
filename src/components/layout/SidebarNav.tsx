"use client"
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Settings, UsersRound, Code2, ListOrdered, Palette, Zap, ListTodo, DatabaseZap, SlidersHorizontal, KanbanSquare, Settings2, UserCog, Loader2 } from "lucide-react"; 
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";
import type { PlatformModuleId, SettingsNavigationItem } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { settingsNavItems } from '@/app/settings/layout';


const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/positions", label: "Positions", icon: Briefcase },
  { href: "/settings", label: "Settings", icon: Settings },
];

const myTaskBoardNavItem = { href: "/my-tasks", label: "My Task Board", icon: ListTodo };

const baseSettingsSubItems = [
  { href: "/settings/preferences", label: "Preferences", icon: Palette },
  { href: "/settings/integrations", label: "Integrations", icon: Zap },
  { href: "/settings/stages", label: "Recruitment Stages", icon: KanbanSquare, permissionId: 'RECRUITMENT_STAGES_MANAGE' as PlatformModuleId },
  { href: "/settings/data-models", label: "Data Models (Client)", icon: DatabaseZap, permissionId: 'DATA_MODELS_MANAGE' as PlatformModuleId },
  { href: "/settings/custom-fields", label: "Custom Fields (Server)", icon: Settings2, permissionId: 'CUSTOM_FIELDS_MANAGE' as PlatformModuleId },
  { href: "/settings/webhook-mapping", label: "Webhook Payload Mapping", icon: SlidersHorizontal, permissionId: 'WEBHOOK_MAPPING_MANAGE' as PlatformModuleId },
  { href: "/users", label: "Manage Users", icon: UsersRound, adminOnly: true },
  { href: "/settings/user-groups", label: "Manage User Groups", icon: UserCog, permissionId: 'USER_GROUPS_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true }, // New item
  { href: "/api-docs", label: "API Docs", icon: Code2 },
  { href: "/logs", label: "Logs", icon: ListOrdered, adminOnly: true },
];

// Memoize SidebarNav to prevent unnecessary re-renders
const SidebarNavComponent = function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { state: sidebarState, isMobile } = useSidebar();
  const { data: session, status: sessionStatus } = useSession();
  const userRole = session?.user?.role;
  const modulePermissions = session?.user?.modulePermissions || [];

  const [isClient, setIsClient] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [navigatingTo, setNavigatingTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Stop loading when pathname changes (navigation completes)
  React.useEffect(() => {
    setIsNavigating(false);
    setNavigatingTo(null);
  }, [pathname]);

  const handleNavigation = (href: string) => {
    setIsNavigating(true);
    setNavigatingTo(href);
    router.push(href);
  };

  const canAccess = (item: SettingsNavigationItem) => {
    if (!isClient || sessionStatus !== 'authenticated' || !session?.user) return false;
    if (item.adminOnly && userRole !== 'Admin') return false;
    if (item.adminOnlyOrPermission) {
      if (userRole === 'Admin') return true;
      if (item.permissionId && modulePermissions.includes(item.permissionId)) return true;
      return false;
    }
    if (item.permissionId && userRole !== 'Admin' && !modulePermissions.includes(item.permissionId)) return false;
    return true;
  };

  const visibleNavItems = React.useMemo(() => settingsNavItems.filter(canAccess), [isClient, session, sessionStatus]);

  const initialIsSettingsSectionActive = React.useMemo(() => {
    return baseSettingsSubItems.some(item => {
       if (!canAccess(item)) return false;
      return pathname.startsWith(item.href);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, userRole, sessionStatus, modulePermissions, isClient]);


  const clientSettingsSubItems = React.useMemo(() => {
    return baseSettingsSubItems.filter(item => canAccess(item));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, modulePermissions, isClient, sessionStatus]);

  const isAnyMainNavItemActive = mainNavItems.some(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
  const isMyTaskBoardActive = myTaskBoardNavItem.href === pathname || pathname.startsWith(myTaskBoardNavItem.href + "/");
  
  const currentClientIsSettingsSectionActive = isClient && clientSettingsSubItems.some(item => pathname.startsWith(item.href));

  const [accordionValue, setAccordionValue] = React.useState<string | undefined>(() => {
    if (initialIsSettingsSectionActive) {
      return "settings-group";
    }
    return undefined;
  });

  React.useEffect(() => {
    if (isClient) {
      if (currentClientIsSettingsSectionActive) {
        if (accordionValue !== "settings-group") {
          setAccordionValue("settings-group");
        }
      } else if (isAnyMainNavItemActive || isMyTaskBoardActive) {
        if (accordionValue === "settings-group") {
          setAccordionValue(undefined);
        }
      }
    }
  }, [pathname, currentClientIsSettingsSectionActive, isAnyMainNavItemActive, isMyTaskBoardActive, isClient, accordionValue]);


  return (
      <SidebarMenu className="bg-background border-r border-border min-h-screen py-6 px-2 flex flex-col gap-2 shadow-md">
        {/* Main Navigation */}
        <div className="mb-2">
          <div className="text-xs font-semibold text-muted-foreground px-4 mb-2 tracking-widest uppercase">Main</div>
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const isNavigatingToThis = navigatingTo === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "w-full justify-start rounded-full px-4 py-2 my-1 transition-all flex items-center gap-3 text-base",
                    isActive
                      ? "bg-primary/90 text-white font-bold shadow-lg scale-105"
                      : "hover:bg-primary/10 hover:text-primary text-muted-foreground"
                  )}
                  tooltip={item.label}
                  onClick={() => {
                    if (accordionValue === "settings-group" && !currentClientIsSettingsSectionActive) {
                      setAccordionValue(undefined);
                    }
                    handleNavigation(item.href);
                  }}
                  size="default"
                  data-active={isActive}
                  disabled={isNavigating}
                  aria-label={item.label}
                >
                  <div className="flex items-center gap-3 w-full">
                    {isNavigatingToThis ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <item.icon className="h-6 w-6" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </div>
        <Separator className="my-2" />
        {/* Task Board */}
        {isClient && (userRole === 'Recruiter' || userRole === 'Admin') && (
          <div className="mb-2">
            <div className="text-xs font-semibold text-muted-foreground px-4 mb-2 tracking-widest uppercase">Tasks</div>
            <SidebarMenuItem key={myTaskBoardNavItem.href}>
              <SidebarMenuButton
                asChild
                isActive={isMyTaskBoardActive}
                className={cn(
                  "w-full justify-start rounded-full px-4 py-2 my-1 transition-all flex items-center gap-3 text-base",
                  isMyTaskBoardActive
                    ? "bg-primary/90 text-white font-bold shadow-lg scale-105"
                    : "hover:bg-primary/10 hover:text-primary text-muted-foreground"
                )}
                tooltip={myTaskBoardNavItem.label}
                onClick={() => {
                  if (accordionValue === "settings-group" && !currentClientIsSettingsSectionActive) {
                    setAccordionValue(undefined);
                  }
                  handleNavigation(myTaskBoardNavItem.href);
                }}
                size="default"
                data-active={isMyTaskBoardActive}
                disabled={isNavigating}
                aria-label={myTaskBoardNavItem.label}
              >
                <div className="flex items-center gap-3 w-full">
                  {navigatingTo === myTaskBoardNavItem.href ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <myTaskBoardNavItem.icon className="h-6 w-6" />
                  )}
                  <span className="truncate">{myTaskBoardNavItem.label}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </div>
        )}
        {/* Settings and other sections can be grouped similarly if needed */}
      </SidebarMenu>
  );
};

const SidebarNav = React.memo(SidebarNavComponent);
export default SidebarNav;
