
"use client"
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Settings, UsersRound, Code2, ListOrdered, Palette, Zap, ListTodo, FileText, UserCog, Info } from "lucide-react";
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
  // { href: "/system-status", label: "System Status", icon: Info }, // Removed as per user request
  // { href: "/setup", label: "Application Setup", icon: UserCog, clientOnly: true }, // Removed as per user request
];

export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState, isMobile } = useSidebar();
  const { data: session, status: sessionStatus } = useSession();
  const userRole = session?.user?.role;

  const [isClient, setIsClient] = React.useState(false);
  // const [isSetupComplete, setIsSetupComplete] = React.useState(true); // Setup page removed

  React.useEffect(() => {
    setIsClient(true);
    // const setupFlag = localStorage.getItem('setupComplete') === 'true'; // Setup page removed
    // setIsSetupComplete(setupFlag); // Setup page removed
  }, []);

  // Calculate initial active state for settings accordion trigger based *only* on pathname and base items
  // This value is used for the `data-active` prop to ensure SSR consistency
  const initialIsSettingsSectionActive = React.useMemo(() => {
    return baseSettingsSubItems.some(item => {
      // For "/users" and "/logs", only consider them active for initial SSR if the role is admin.
      // If sessionStatus isn't 'authenticated', we can't know the role, so conservatively assume not active for these admin-only links.
      if (item.adminOnly) {
        // This check is tricky for SSR as session might not be fully resolved.
        // For initial `data-active`, it's safer to be conservative or rely solely on path if roles are dynamic.
        // A simpler approach for `data-active` might be to only check non-adminOnly items or always check path.
        // Let's assume for `data-active` we just check path for now.
        return pathname.startsWith(item.href);
      }
      return pathname.startsWith(item.href);
    });
  }, [pathname]);


  const clientSettingsSubItems = React.useMemo(() => {
    return baseSettingsSubItems.filter(item => {
      // if (item.href === "/setup" && isSetupComplete) return false; // Setup page removed
      if (item.adminOnly && userRole !== 'Admin') {
        return false;
      }
      return true;
    });
  }, [userRole]); // Removed isSetupComplete

  const isAnyMainNavItemActive = mainNavItems.some(item => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
  const isMyTasksActive = myTasksNavItem.href === pathname || pathname.startsWith(myTasksNavItem.href + "/");
  
  // This derived state is based on client-side resolved items and pathname
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
        setAccordionValue("settings-group");
      } else if (isAnyMainNavItemActive || isMyTasksActive) {
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
                        {/*
                          When Link has legacyBehavior, it expects an <a> tag as a direct child,
                          or its child component must accept an href and forward a ref.
                          SidebarMenuButton should render as a button by default.
                          Link will wrap it with an <a> tag.
                        */}
                        <SidebarMenuButton
                          isActive={pathname.startsWith(item.href)}
                          className="w-full justify-start"
                          size="sm"
                          tooltip={item.label}
                          data-active={pathname.startsWith(item.href)}
                          // No asChild here, let Link render the <a>
                        >
                          {/* Content directly inside SidebarMenuButton */}
                          {item.icon && <item.icon className="h-4 w-4 ml-[1px]" />}
                          <span className="truncate">{item.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                  {!isClient && baseSettingsSubItems.filter(item => !item.adminOnly).map(item => (
                     <SidebarMenuItem key={item.href + "-ssr"}>
                        <SidebarMenuButton
                          isActive={false}
                          className="w-full justify-start pointer-events-none opacity-50"
                          size="sm"
                          tooltip={item.label}
                          data-active={false}
                        >
                          {item.icon && <item.icon className="h-4 w-4 ml-[1px]" />}
                          <span className="truncate">{item.label}</span>
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
