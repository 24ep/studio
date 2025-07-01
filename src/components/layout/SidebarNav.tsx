"use client"
import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { sidebarConfig } from "./SidebarNavConfig";
import Link from "next/link";
import Image from "next/image";

const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName';
const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_LOGO_ICON = <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect width="100%" height="100%" rx="8" fill="#e0e7ff"/><text x="50%" y="55%" textAnchor="middle" fill="#6366f1" fontSize="14" fontWeight="bold" dy=".3em">CT</text></svg>;

const SidebarNav = React.memo(function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const [appLogoUrl, setAppLogoUrl] = React.useState<string | null>(null);
  const [currentAppName, setCurrentAppName] = React.useState<string>(DEFAULT_APP_NAME);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setAppLogoUrl(localStorage.getItem(APP_LOGO_DATA_URL_KEY));
      setCurrentAppName(localStorage.getItem(APP_CONFIG_APP_NAME_KEY) || DEFAULT_APP_NAME);
    }
  }, []);

  return (
    <Sidebar className="bg-gradient-to-b from-sidebar-background to-sidebar-background-end border-r border-sidebar-border shadow-lg min-h-screen">
      <div className="flex flex-col items-center justify-center py-6 select-none">
        <Link href="/" className="flex flex-col items-center gap-2">
          {isClient && appLogoUrl ? (
            <Image src={appLogoUrl} alt="App Logo" width={40} height={40} className="h-10 w-10 object-contain rounded" />
          ) : (
            DEFAULT_LOGO_ICON
          )}
          <span className="mt-1 text-lg font-bold text-primary tracking-tight text-center whitespace-nowrap">
            {currentAppName}
          </span>
        </Link>
      </div>
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
                      <Link href={item.href} className="flex items-center gap-3 w-full">
                        <item.icon className="h-5 w-5" />
                        <span className="truncate">{item.label}</span>
                      </Link>
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
