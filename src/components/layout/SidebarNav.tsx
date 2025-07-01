"use client"
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, Settings, UsersRound, Code2, ListOrdered, Palette, Zap, ListTodo, DatabaseZap, SlidersHorizontal, KanbanSquare, Settings2, UserCog, Loader2, UploadCloud, Home, Building2, FileText, BarChart3 } from "lucide-react"; 
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useSession } from "next-auth/react";
import type { PlatformModuleId, SettingsNavigationItem } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { settingsNavItems } from '@/app/settings/layout';
import { useEffect } from "react";

// Enhanced navigation items with better categorization
const mainNavItems = [
  { 
    href: "/", 
    label: "Dashboard", 
    icon: LayoutDashboard, 
    description: "Main dashboard overview",
    category: "main"
  },
  { 
    href: "/candidates", 
    label: "Candidates", 
    icon: Users, 
    description: "View and manage candidates",
    category: "recruitment"
  },
  { 
    href: "/positions", 
    label: "Positions", 
    icon: Briefcase, 
    description: "View and manage positions",
    category: "recruitment"
  },
  { 
    href: "/candidates/upload", 
    label: "Bulk Upload", 
    icon: UploadCloud, 
    description: "Bulk upload candidate CVs",
    category: "recruitment"
  },
];

const myTaskBoardNavItem = { 
  href: "/my-tasks", 
  label: "My Task Board", 
  icon: ListTodo, 
  description: "Your personal task board",
  category: "personal"
};

const baseSettingsSubItems = [
  { href: "/settings/system-settings", label: "System Settings", icon: Zap, description: "Third-party integrations" },
  { href: "/settings/stages", label: "Recruitment Stages", icon: KanbanSquare, permissionId: 'RECRUITMENT_STAGES_MANAGE' as PlatformModuleId, description: "Manage recruitment stages" },
  { href: "/settings/data-models", label: "Data Models (Client)", icon: DatabaseZap, permissionId: 'DATA_MODELS_MANAGE' as PlatformModuleId, description: "Client-side data models" },
  { href: "/settings/custom-fields", label: "Custom Fields (Server)", icon: Settings2, permissionId: 'CUSTOM_FIELDS_MANAGE' as PlatformModuleId, description: "Server-side custom fields" },
  { href: "/settings/webhook-mapping", label: "Webhook Payload Mapping", icon: SlidersHorizontal, permissionId: 'WEBHOOK_MAPPING_MANAGE' as PlatformModuleId, description: "Configure webhook payloads" },
  { href: "/users", label: "Manage Users", icon: UsersRound, adminOnly: true, description: "User management" },
  { href: "/settings/user-groups", label: "Manage User Groups", icon: UserCog, permissionId: 'USER_GROUPS_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true, description: "User group management" },
  { href: "/api-docs", label: "API Docs", icon: Code2, description: "API documentation" },
  { href: "/logs", label: "Logs", icon: ListOrdered, adminOnly: true, description: "System logs" },
];

const SIDEBAR_COLOR_KEYS = [
  'sidebarBgStartL', 'sidebarBgEndL', 'sidebarTextL',
  'sidebarActiveBgStartL', 'sidebarActiveBgEndL', 'sidebarActiveTextL',
  'sidebarHoverBgL', 'sidebarHoverTextL', 'sidebarBorderL',
  'sidebarBgStartD', 'sidebarBgEndD', 'sidebarTextD',
  'sidebarActiveBgStartD', 'sidebarActiveBgEndD', 'sidebarActiveTextD',
  'sidebarHoverBgD', 'sidebarHoverTextD', 'sidebarBorderD',
];

function setSidebarCSSVars(settings: Record<string, string>) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  
  // Map settings keys to Tailwind CSS variable names
  const cssVarMapping: Record<string, string> = {
    // Light theme
    'sidebarBgStartL': '--sidebar-background',
    'sidebarTextL': '--sidebar-foreground',
    'sidebarBorderL': '--sidebar-border',
    'sidebarActiveBgStartL': '--sidebar-primary',
    'sidebarActiveTextL': '--sidebar-primary-foreground',
    'sidebarHoverBgL': '--sidebar-accent',
    'sidebarHoverTextL': '--sidebar-accent-foreground',
    
    // Dark theme
    'sidebarBgStartD': '--sidebar-background',
    'sidebarTextD': '--sidebar-foreground',
    'sidebarBorderD': '--sidebar-border',
    'sidebarActiveBgStartD': '--sidebar-primary',
    'sidebarActiveTextD': '--sidebar-primary-foreground',
    'sidebarHoverBgD': '--sidebar-accent',
    'sidebarHoverTextD': '--sidebar-accent-foreground',
  };

  // Set CSS variables based on current theme
  const isDark = document.documentElement.classList.contains('dark');
  const themeSuffix = isDark ? 'D' : 'L';
  
  SIDEBAR_COLOR_KEYS.forEach(key => {
    if (key.endsWith(themeSuffix) && settings[key]) {
      const cssVarName = cssVarMapping[key];
      if (cssVarName) {
        root.style.setProperty(cssVarName, settings[key]);
      }
    }
  });
}

// Helper to determine the most specific active nav item
function getActiveNavItem(pathname: string, navItems: { href: string }[]) {
  // Sort by href length descending to prioritize more specific (deeper) routes
  const sorted = [...navItems].sort((a, b) => b.href.length - a.href.length);
  return sorted.find(item => pathname === item.href) ||
         sorted.find(item => item.href !== "/" && pathname.startsWith(item.href));
}

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

  const visibleNavItems = React.useMemo(() => {
    // Ensure settingsNavItems is an array before calling filter
    const safeSettingsNavItems = Array.isArray(settingsNavItems) ? settingsNavItems : [];
    return safeSettingsNavItems.filter(canAccess);
  }, [isClient, session, sessionStatus]);

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

  useEffect(() => {
    async function fetchSidebarColors() {
      try {
        const res = await fetch('/api/settings/system-settings');
        if (!res.ok) return;
        const settingsArr: any[] = await res.json();
        const settings: Record<string, string> = {};
        settingsArr.forEach((s: any) => { settings[s.key] = s.value; });
        setSidebarCSSVars(settings);
      } catch {}
    }
    
    function updateColors() {
      fetchSidebarColors();
    }
    
    fetchSidebarColors();
    
    // Listen for appConfigChanged event to update sidebar colors live
    window.addEventListener('appConfigChanged', updateColors);
    
    // Listen for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains('dark') !== target.classList.contains('dark')) {
            updateColors();
          }
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => {
      window.removeEventListener('appConfigChanged', updateColors);
      observer.disconnect();
    };
  }, []);

  // Group navigation items by category
  const recruitmentItems = mainNavItems.filter(item => item.category === 'recruitment');
  const mainItems = mainNavItems.filter(item => item.category === 'main');

  return (
    <div className="flex flex-col gap-6">
      {/* Main Navigation */}
      <SidebarGroup>
        <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground tracking-widest uppercase">
          Overview
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {mainItems.map((item) => {
              const activeItem = getActiveNavItem(pathname, mainItems);
              const isActive = activeItem && activeItem.href === item.href;
              const isNavigatingToThis = navigatingTo === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "w-full justify-start rounded-lg px-3 py-2.5 transition-all duration-200 flex items-center gap-3 text-sm font-medium",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md scale-[1.02] font-semibold"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                    )}
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
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <item.icon className="h-5 w-5" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Recruitment Section */}
      <SidebarGroup>
        <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground tracking-widest uppercase">
          Recruitment
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {recruitmentItems.map((item) => {
              const activeItem = getActiveNavItem(pathname, recruitmentItems);
              const isActive = activeItem && activeItem.href === item.href;
              const isNavigatingToThis = navigatingTo === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      "w-full justify-start rounded-lg px-3 py-2.5 transition-all duration-200 flex items-center gap-3 text-sm font-medium",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md scale-[1.02] font-semibold"
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                    )}
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
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <item.icon className="h-5 w-5" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Personal Section */}
      {isClient && (userRole === 'Recruiter' || userRole === 'Admin') && (
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            Personal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem key={myTaskBoardNavItem.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isMyTaskBoardActive}
                  className={cn(
                    "w-full justify-start rounded-lg px-3 py-2.5 transition-all duration-200 flex items-center gap-3 text-sm font-medium",
                    isMyTaskBoardActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md scale-[1.02] font-semibold"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                  )}
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
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <myTaskBoardNavItem.icon className="h-5 w-5" />
                    )}
                    <span className="truncate">{myTaskBoardNavItem.label}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Settings Section */}
      {clientSettingsSubItems.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Accordion
              type="single"
              collapsible
              value={accordionValue}
              onValueChange={setAccordionValue}
              className="w-full"
            >
              <AccordionItem value="settings-group" className="border-none">
                <AccordionTrigger
                  asChild
                  className={cn(
                    "w-full justify-start rounded-lg px-3 py-2.5 transition-all duration-200 flex items-center gap-3 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground",
                    currentClientIsSettingsSectionActive && "bg-sidebar-primary text-sidebar-primary-foreground shadow-md scale-[1.02] font-semibold"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Settings className="h-5 w-5" />
                    <span className="truncate">Settings</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <SidebarMenu className="ml-4 space-y-1">
                    {clientSettingsSubItems.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      const isNavigatingToThis = navigatingTo === item.href;
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={cn(
                              "w-full justify-start rounded-md px-3 py-2 transition-all duration-200 flex items-center gap-3 text-sm",
                              isActive
                                ? "bg-sidebar-primary/20 text-sidebar-primary-foreground font-medium"
                                : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground text-sidebar-foreground/80"
                            )}
                            onClick={() => handleNavigation(item.href)}
                            size="sm"
                            data-active={isActive}
                            disabled={isNavigating}
                            aria-label={item.label}
                          >
                            <div className="flex items-center gap-3 w-full">
                              {isNavigatingToThis ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <item.icon className="h-4 w-4" />
                              )}
                              <span className="truncate text-xs">{item.label}</span>
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
    </div>
  );
};

const SidebarNav = React.memo(SidebarNavComponent);
export default SidebarNav;
