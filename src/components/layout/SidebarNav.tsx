
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
  { href: "/users", label: "Manage Users", icon: UsersRound, adminOnly: true },
  { href: "/api-docs", label: "API Docs", icon: Code2 },
  { href: "/logs", label: "Logs", icon: ListOrdered, adminOnly: true },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState, isMobile } = useSidebar();
  const { data: session, status: sessionStatus } = useSession();
  const userRole = session?.user?.role;

  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Calculate clientSettingsSubItems which depends on client-side data (session)
  const clientSettingsSubItems = React.useMemo(() => {
    return baseSettingsSubItems.filter(item => {
      if (item.adminOnly && userRole !== 'Admin') {
        return false;
      }
      return true;
    });
  }, [userRole]);

  // For the data-active attribute on AccordionTrigger - MUST be consistent SSR vs Client initial
  // This calculation should not depend on `isClient` or dynamic session states for the *initial* render.
  // It checks if the current path starts with any of the base setting items' hrefs.
  const initialIsSettingsSectionActive = React.useMemo(() => {
    return baseSettingsSubItems.some(item =>
      pathname.startsWith(item.href) &&
      (!item.adminOnly || (sessionStatus === 'authenticated' && userRole === 'Admin') || (sessionStatus !== 'authenticated' && !item.adminOnly)) // Simplified check for SSR
    );
  }, [pathname, userRole, sessionStatus]);


  // For managing accordion open/close state - can use fully client-side info
  const currentClientIsSettingsSectionActive = clientSettingsSubItems.some(item => pathname.startsWith(item.href));
  const isAnyMainNavItemActive = mainNavItems.some(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
  const isMyTasksActive = myTasksNavItem.href === pathname || pathname.startsWith(myTasksNavItem.href + "/");


  const [accordionValue, setAccordionValue] = React.useState<string | undefined>(() => {
    if (initialIsSettingsSectionActive) { // Use SSR-friendly value for initial open state
      return "settings-group";
    }
    return undefined;
  });

  React.useEffect(() => {
    // This effect runs on the client after hydration and can update the accordion state
    // based on fully resolved client-side information.
    if (isClient) { // Ensure this runs only on the client
      if (currentClientIsSettingsSectionActive) {
        setAccordionValue("settings-group");
      } else if (isAnyMainNavItemActive || isMyTasksActive) {
         // If a main nav item is active, ensure settings accordion is closed
        setAccordionValue(undefined);
      }
    }
  }, [pathname, currentClientIsSettingsSectionActive, isAnyMainNavItemActive, isMyTasksActive, isClient]);


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
                     setAccordionValue(undefined); // Close settings if not active
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
          <SidebarMenuItem key={myTasksNavItem.href}>
            <Link href={myTasksNavItem.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={isMyTasksActive}
                className="w-full justify-start"
                tooltip={myTasksNavItem.label}
                 onClick={() => {
                   if (accordionValue === "settings-group" && !currentClientIsSettingsSectionActive) {
                    setAccordionValue(undefined); // Close settings if not active
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
            value={accordionValue} // Controlled by state
            onValueChange={setAccordionValue} // Update state on change
          >
            <AccordionItem value="settings-group" className="border-b-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <AccordionTrigger
                    className={cn(
                      "flex w-full items-center gap-2 overflow-hidden rounded-md px-3 py-2 text-left text-sm outline-none ring-sidebar-ring transition-all focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                      "my-1 justify-between group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2",
                      "hover:no-underline"
                      // Active styling for AccordionTrigger is now primarily handled by globals.css based on data-active
                    )}
                    data-active={initialIsSettingsSectionActive} // SSR-friendly data-active
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
                  {isClient && clientSettingsSubItems.map((item) => ( // Render links based on client-side filtered items
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
                  {/* Render skeletons or nothing if !isClient, to avoid SSR/client mismatch for these items */}
                  {!isClient && baseSettingsSubItems.filter(item => !item.adminOnly).map(item => ( // Render non-admin items as placeholders during SSR
                     <SidebarMenuItem key={item.href + "-ssr"}>
                        <SidebarMenuButton
                          isActive={false}
                          className="w-full justify-start pointer-events-none opacity-50"
                          size="sm"
                          tooltip={item.label}
                          data-active={false}
                          asChild
                        >
                          <a>
                            {item.icon && <item.icon className="h-4 w-4 ml-[1px]" />}
                            <span className="truncate">{item.label}</span>
                          </a>
                        </SidebarMenuButton>
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
