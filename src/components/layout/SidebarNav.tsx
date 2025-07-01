"use client"
import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { sidebarConfig } from "./SidebarNavConfig";

const SidebarNav = React.memo(function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return (
    <Sidebar className="bg-gradient-to-b from-sidebar-background to-sidebar-background-end border-r border-sidebar-border shadow-lg min-h-screen">
      {sidebarConfig.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground tracking-widest uppercase">
            {group.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items
                .filter(item => !item.adminOnly || userRole === "Admin")
                .map(item => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      aria-label={item.label}
                      className="w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors duration-150 text-sm font-medium hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <item.icon className="h-5 w-5" />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </Sidebar>
  );
});
export default SidebarNav;
