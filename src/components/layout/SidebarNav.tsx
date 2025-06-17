
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
import type { PlatformModuleId } from '@/lib/types';


const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/positions", label: "Positions", icon: Briefcase },
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

  const canAccess = (item: { adminOnly?: boolean, permissionId?: PlatformModuleId, adminOnlyOrPermission?: boolean }) => {
    if (!isClient || sessionStatus !== 'authenticated') return false;
    if (item.adminOnly && userRole !== 'Admin') return false;
    if (item.adminOnlyOrPermission) { // If true, user needs to be Admin OR have the permission
      if (userRole === 'Admin') return true;
      if (item.permissionId && modulePermissions.includes(item.permissionId)) return true;
      return false;
    }
    if (item.permissionId && userRole !== 'Admin' && !modulePermissions.includes(item.permissionId)) return false;
    return true;
  };

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
      <SidebarMenu>
        {mainNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))}
                className="w-full justify-start"
                tooltip={item.label}
                onClick={() => {
                  if (accordionValue === "settings-group" && !currentClientIsSettingsSectionActive) {
                     setAccordionValue(undefined);
                  }
                }}
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
                tooltip={myTaskBoardNavItem.label}
                 onClick={() => {
                   if (accordionValue === "settings-group" && !currentClientIsSettingsSectionActive) {
                    setAccordionValue(undefined);
                   }
                 }}
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
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={accordionValue}
            onValueChange={setAccordionValue}
          >
            <AccordionItem value="settings-group" className="border-b-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <AccordionTrigger
                    className={cn(
                      "flex w-full items-center gap-2 overflow-hidden rounded-md px-3 py-2 text-left text-sm outline-none ring-sidebar-ring transition-all focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                      "my-1 justify-between group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2",
                      "hover:no-underline"
                    )}
                    data-active={initialIsSettingsSectionActive}
                  >
                    <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                      <Settings className="h-5 w-5" />
                      <span className="truncate">Settings</span>
                    </div>
                    <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex">
                      <Settings className="h-5 w-5" />
                    </div>
                  </AccordionTrigger>
                </TooltipTrigger>
                <TooltipContent side="right" align="center" hidden={sidebarState !== "collapsed" || isMobile}>
                  Settings
                </TooltipContent>
              </Tooltip>
              <AccordionContent className="pt-1 pb-0 pl-3 pr-0 group-data-[collapsible=icon]:hidden">
                <SidebarMenu className="flex flex-col gap-0.5 py-0">
                  {isClient && clientSettingsSubItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <Link href={item.href} passHref legacyBehavior>
                        <SidebarMenuButton
                          isActive={pathname.startsWith(item.href)}
                          className="w-full justify-start"
                          size="sm"
                          tooltip={item.label}
                          data-active={pathname.startsWith(item.href)}
                        >
                          {item.icon && <item.icon className="h-4 w-4 ml-[1px]" />}
                          <span className="truncate">{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SidebarMenuItem>
      </SidebarMenu>
  );
}
