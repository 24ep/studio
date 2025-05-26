
"use client"
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Settings, UsersRound, Code2, ListOrdered, Palette, Zap, ListTodo } from "lucide-react";
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


const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/positions", label: "Positions", icon: Briefcase },
];

const myTasksNavItem = { href: "/my-tasks", label: "My Tasks", icon: ListTodo };

const baseSettingsSubItems = [
  { href: "/settings/preferences", label: "Preferences", icon: Palette },
  { href: "/settings/integrations", label: "Integrations", icon: Zap },
  { href: "/users", label: "Manage Users", icon: UsersRound },
  { href: "/api-docs", label: "API Docs", icon: Code2 },
  { href: "/logs", label: "Logs", icon: ListOrdered },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState, isMobile } = useSidebar();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const [isClient, setIsClient] = React.useState(false);
  const [isSetupComplete, setIsSetupComplete] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const setupFlag = localStorage.getItem('setupComplete') === 'true';
    setIsSetupComplete(setupFlag);
  }, []);

  // For rendering links inside the accordion - uses client-side info
  const clientSettingsSubItems = React.useMemo(() => {
    let items = baseSettingsSubItems;
    if (isClient && isSetupComplete) {
        items = items.filter(item => item.href !== "/setup"); // /setup link is removed
    }
    if (userRole !== 'Admin') {
        items = items.filter(item => item.href !== "/users");
    }
    return items;
  }, [userRole, isClient, isSetupComplete]);

  // For the data-active attribute on AccordionTrigger - MUST be consistent SSR vs Client initial
  const initialIsSettingsSectionActive = baseSettingsSubItems.some(item => pathname.startsWith(item.href) && item.href !== "/setup" && (userRole === 'Admin' || item.href !== "/users"));


  // For managing accordion open/close state - can use client-side info
  const currentClientIsSettingsSectionActive = clientSettingsSubItems.some(item => pathname.startsWith(item.href));
  const isAnyMainNavItemActive = mainNavItems.some(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
  const isMyTasksActive = pathname === myTasksNavItem.href || pathname.startsWith(myTasksNavItem.href + "/");

  const [accordionValue, setAccordionValue] = React.useState<string | undefined>(() => {
    // Set initial accordion state based on initially calculated active state
    if (initialIsSettingsSectionActive) {
      return "settings-group";
    }
    return undefined;
  });

  React.useEffect(() => {
    // Effect to potentially update accordion open state based on fully client-side resolved active state
    if (currentClientIsSettingsSectionActive) {
      setAccordionValue("settings-group");
    } else if (isAnyMainNavItemActive || isMyTasksActive) {
      setAccordionValue(undefined); 
    }
  }, [pathname, currentClientIsSettingsSectionActive, isAnyMainNavItemActive, isMyTasksActive]);


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

        {(userRole === 'Recruiter' || userRole === 'Admin') && (
          <SidebarMenuItem key={myTasksNavItem.href}>
            <Link href={myTasksNavItem.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={isMyTasksActive}
                className="w-full justify-start"
                tooltip={myTasksNavItem.label}
                 onClick={() => {
                  if (accordionValue === "settings-group" && !currentClientIsSettingsSectionActive) {
                    setAccordionValue(undefined);
                  }
                }}
                size="default"
                data-active={isMyTasksActive}
              >
                <a>
                  <myTasksNavItem.icon className="h-5 w-5" />
                  <span className="truncate">{myTasksNavItem.label}</span>
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
                      initialIsSettingsSectionActive && "bg-sidebar-active-background-l dark:bg-sidebar-active-background-d text-sidebar-active-foreground-l dark:text-sidebar-active-foreground-d",
                      !initialIsSettingsSectionActive && "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "hover:no-underline"
                    )}
                    data-active={initialIsSettingsSectionActive} // Use SSR-friendly value for data-active
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
                  {clientSettingsSubItems.map((item) => ( // Render links based on client-side filtered items
                    <SidebarMenuItem key={item.href}>
                      <Link href={item.href} passHref legacyBehavior>
                        <SidebarMenuButton
                          isActive={pathname.startsWith(item.href)}
                          className="w-full justify-start"
                          size="sm"
                          tooltip={item.label}
                          data-active={pathname.startsWith(item.href)}
                        >
                          <a>
                            {item.icon && <item.icon className="h-4 w-4 ml-[1px]" />}
                            <span className="truncate">{item.label}</span>
                          </a>
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
