
"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, UploadCloud, Briefcase, Settings, UsersRound, Code2, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar, // Import useSidebar
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
} from "@/components/ui/tooltip"; // Import Tooltip components

const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/positions", label: "Positions", icon: Briefcase },
  { href: "/upload", label: "Upload Resume", icon: UploadCloud },
];

const settingsSubItems = [
  { href: "/settings", label: "General Settings", icon: Settings, isGeneral: true }, // Special flag or rely on first item
  { href: "/users", label: "Manage Users", icon: UsersRound },
  { href: "/api-docs", label: "API Docs", icon: Code2 },
  { href: "/logs", label: "Logs", icon: ListOrdered },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { state: sidebarState, isMobile } = useSidebar(); // Get sidebar state for tooltip visibility

  const isSettingsSectionActive = settingsSubItems.some(item => pathname.startsWith(item.href));

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
            >
              <a>
                <item.icon className="h-5 w-5" />
                <span className="truncate">{item.label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}

      {/* Settings Accordion Section */}
      <SidebarMenuItem className="mt-auto"> {/* Using mt-auto as an example, adjust as needed or remove if grouping is different */}
        <Accordion type="single" collapsible className="w-full" defaultValue={isSettingsSectionActive ? "settings-group" : undefined}>
          <AccordionItem value="settings-group" className="border-b-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <AccordionTrigger
                  className={cn(
                    "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                    "justify-between group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2", // Collapsed icon state
                    isSettingsSectionActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 font-medium", // Active state for the trigger
                    "hover:no-underline py-2" // AccordionTrigger specific overrides
                  )}
                  // Tooltip for collapsed state handled by Tooltip wrapper
                >
                  <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                    <Settings className="h-5 w-5" />
                    <span className="truncate">Settings</span>
                  </div>
                   <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex"> {/* Icon only for collapsed state */}
                    <Settings className="h-5 w-5" />
                  </div>
                  {/* Default ChevronDown from AccordionTrigger will be used here but hidden in icon mode by default styles */}
                </AccordionTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" hidden={sidebarState !== "collapsed" || isMobile}>
                Settings
              </TooltipContent>
            </Tooltip>
            <AccordionContent className="pt-1 pb-0 pl-3 pr-0 group-data-[collapsible=icon]:hidden">
              <SidebarMenu className="flex flex-col gap-0.5 py-0">
                {settingsSubItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} passHref legacyBehavior>
                      <SidebarMenuButton
                        isActive={pathname.startsWith(item.href)}
                        className="w-full justify-start"
                        size="sm"
                        tooltip={item.label}
                      >
                        {item.isGeneral ? (
                           <Settings className="h-4 w-4 ml-[1px]" /> // Keep icon for general settings
                        ) : (
                          item.icon && <item.icon className="h-4 w-4 ml-[1px]" />
                        )}
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
