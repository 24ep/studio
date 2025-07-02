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
      // Read localStorage values once
      const storedLogo = localStorage.getItem(APP_LOGO_DATA_URL_KEY);
      const storedAppName = localStorage.getItem(APP_CONFIG_APP_NAME_KEY);
      
      setAppLogoUrl(storedLogo);
      setCurrentAppName(storedAppName || DEFAULT_APP_NAME);
      
      // Listen for app config changes
      const handleAppConfigChange = (event: Event) => {
        const customEvent = event as CustomEvent<{ appName?: string; logoUrl?: string | null }>;
        if (customEvent.detail) {
          if (customEvent.detail.appName) {
            setCurrentAppName(customEvent.detail.appName);
          }
          if (customEvent.detail.logoUrl !== undefined) {
            setAppLogoUrl(customEvent.detail.logoUrl);
          }
        }
      };
      
      window.addEventListener('appConfigChanged', handleAppConfigChange);
      return () => {
        window.removeEventListener('appConfigChanged', handleAppConfigChange);
      };
    }
  }, []);

  return (
    <Sidebar className="bg-gradient-to-b from-sidebar-background to-sidebar-background-end min-h-screen flex flex-col" data-sidebar="sidebar">
      {/* Branding section */}
      <div className="sidebar-branding">
        <Link href="/" className="flex flex-row items-center gap-3 px-4 py-4">
          {isClient && appLogoUrl ? (
            <Image src={appLogoUrl} alt="App Logo" width={40} height={40} className="h-10 w-10 object-contain rounded" />
          ) : (
            <span className="h-10 w-10 flex items-center justify-center">{DEFAULT_LOGO_ICON}</span>
          )}
          <span className="app-name text-lg font-bold text-primary tracking-tight whitespace-nowrap">
            {currentAppName}
          </span>
        </Link>
      </div>
      {/* Navigation groups */}
      <div className="flex-1">
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
      </div>
    </Sidebar>
  );
});
export default SidebarNav;
