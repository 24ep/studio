"use client";
import React, { type ReactNode, useState, useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import dynamic from 'next/dynamic';
import { Header } from "./Header";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Package2, Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from 'next/image';
import packageJson from '../../../package.json';
import { setThemeAndColors } from '@/lib/themeUtils';

const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName';
const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_LOGO_ICON = <Package2 className="h-6 w-6" />;

const SidebarNav = dynamic(() => import('./SidebarNav'), { ssr: false });

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/candidates")) { 
    if (pathname.split('/').length === 3 && pathname.split('/')[2] !== '' && !pathname.includes('create-via-automation')) {
        return "Candidate Details";
    }
    return "Candidates";
  }
  if (pathname.startsWith("/positions")) {
     if (pathname.split('/').length === 3 && pathname.split('/')[2] !== '') {
        return "Position Details";
    }
    return "Job Positions";
  }
  if (pathname.startsWith("/users")) return "Manage Users";
  if (pathname.startsWith("/my-tasks")) return "My Task Board";
  if (pathname.startsWith("/settings/preferences")) return "Preferences";
  if (pathname.startsWith("/settings/integrations")) return "Integrations";
  if (pathname.startsWith("/settings/stages")) return "Recruitment Stages";
  if (pathname.startsWith("/settings/data-models")) return "Data Model Preferences";
  if (pathname.startsWith("/settings/custom-fields")) return "Custom Field Definitions";
  if (pathname.startsWith("/settings/webhook-mapping")) return "Webhook Payload Mapping";
  if (pathname.startsWith("/settings/user-groups")) return "User Groups"; // New
  if (pathname.startsWith("/api-docs")) return "API Documentation";
  if (pathname.startsWith("/logs")) return "Application Logs";
  if (pathname.startsWith("/auth/signin")) return "Sign In";
  return DEFAULT_APP_NAME; // Use dynamic app name as fallback for unknown paths
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentAppName, setCurrentAppName] = useState<string>(DEFAULT_APP_NAME);
  const pageTitle = pathname === "/auth/signin" ? "Sign In" : getPageTitle(pathname) || currentAppName; // Use currentAppName in title if needed
  
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const updateAppConfig = () => {
      if (typeof window !== 'undefined') {
        const storedLogo = localStorage.getItem(APP_LOGO_DATA_URL_KEY);
        setAppLogoUrl(storedLogo);
        const storedAppName = localStorage.getItem(APP_CONFIG_APP_NAME_KEY);
        setCurrentAppName(storedAppName || DEFAULT_APP_NAME);
        // Theme and color settings
        const themePreference = localStorage.getItem('appThemePreference') || 'system';
        const primaryGradientStart = localStorage.getItem('primaryGradientStart') || '179 67% 66%';
        const primaryGradientEnd = localStorage.getItem('primaryGradientEnd') || '238 74% 61%';
        // Sidebar colors
        const sidebarColors: Record<string, string> = {};
        [
          'sidebarBgStartL','sidebarBgEndL','sidebarTextL','sidebarActiveBgStartL','sidebarActiveBgEndL','sidebarActiveTextL','sidebarHoverBgL','sidebarHoverTextL','sidebarBorderL',
          'sidebarBgStartD','sidebarBgEndD','sidebarTextD','sidebarActiveBgStartD','sidebarActiveBgEndD','sidebarActiveTextD','sidebarHoverBgD','sidebarHoverTextD','sidebarBorderD',
        ].forEach(key => {
          const val = localStorage.getItem(key);
          if (val) sidebarColors[key] = val;
        });
        setThemeAndColors({ themePreference: themePreference as 'system' | 'light' | 'dark', primaryGradientStart, primaryGradientEnd, sidebarColors });
      }
    };

    updateAppConfig(); // Initial load

    const handleAppConfigChange = (event: Event) => {
        const customEvent = event as CustomEvent<{ appName?: string; logoUrl?: string | null, themePreference?: string, primaryGradientStart?: string, primaryGradientEnd?: string, sidebarColors?: Record<string,string> }>;
        if (customEvent.detail) {
            if (customEvent.detail.appName) {
                setCurrentAppName(customEvent.detail.appName);
            }
            if (customEvent.detail.logoUrl !== undefined) { 
                 setAppLogoUrl(customEvent.detail.logoUrl);
            }
            setThemeAndColors({
              themePreference: (customEvent.detail.themePreference || 'system') as 'system' | 'light' | 'dark',
              primaryGradientStart: customEvent.detail.primaryGradientStart,
              primaryGradientEnd: customEvent.detail.primaryGradientEnd,
              sidebarColors: customEvent.detail.sidebarColors || {},
            });
        } else {
            updateAppConfig();
        }
    };
    
    window.addEventListener('appConfigChanged', handleAppConfigChange);
    return () => {
      window.removeEventListener('appConfigChanged', handleAppConfigChange);
    };
  }, []);

  // Handle page loading state
  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300); // Short delay to show loading state

    return () => clearTimeout(timer);
  }, [pathname]);


  if (pathname === "/auth/signin") {
    return <>{children}</>;
  }

  const isSettingsPage = pathname.startsWith("/settings");

  const renderLogo = (isCollapsed: boolean) => {
    if (isClient && appLogoUrl) {
      return <Image src={appLogoUrl} alt="App Logo" width={isCollapsed ? 32 : 32} height={isCollapsed ? 32 : 32} className={isCollapsed ? "h-8 w-8 object-contain" : "h-8 w-8 object-contain"} data-ai-hint="company logo" />;
    }
    return DEFAULT_LOGO_ICON;
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r bg-sidebar" data-sidebar="sidebar">
        <SidebarHeader className="p-4 flex items-center justify-center h-16 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary group-data-[collapsible=icon]:hidden">
            {renderLogo(false)}
            <span className="ml-1">{currentAppName}</span>
          </Link>
          <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:w-full">
            <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
               {renderLogo(true)}
            </Link>
          </div>
          <SidebarTrigger className="hidden md:group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
        <SidebarContent className="p-4">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {currentAppName} | Version {packageJson.version} </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header pageTitle={pageTitle} />
        <main className={isSettingsPage ? "flex-1 overflow-y-auto relative" : "flex-1 overflow-y-auto relative p-8"}>
          {isPageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-card border shadow-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Loading page...</p>
              </div>
            </div>
          )}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
