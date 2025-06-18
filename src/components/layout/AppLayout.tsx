
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
import { SidebarNav } from "./SidebarNav";
import { Header } from "./Header";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Package2 } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from 'next/image';
import { SetupFlowHandler } from './SetupFlowHandler';
import type { SystemSetting, SystemSettingKey } from '@/lib/types';
import SettingsLayout from '@/app/settings/layout'; // Import the new settings layout

const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_LOGO_ICON = <Package2 className="h-6 w-6" />;

// Default primary gradient HSL strings
const DEFAULT_PRIMARY_GRADIENT_START = "191 75% 60%";
const DEFAULT_PRIMARY_GRADIENT_END = "248 87% 36%";

function getPageTitle(pathname: string, currentAppName: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/candidates")) { 
    if (pathname.split('/').length === 3 && pathname.split('/')[2] !== '' && !pathname.includes('create-via-n8n')) {
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
  if (pathname.startsWith("/my-tasks")) return "My Task Board";
  if (pathname.startsWith("/settings")) return "Settings"; // General title for settings section
  if (pathname.startsWith("/auth/signin")) return "Sign In";
  return currentAppName; 
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [currentAppName, setCurrentAppName] = useState<string>(DEFAULT_APP_NAME);
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const pageTitle = pathname === "/auth/signin" ? "Sign In" : getPageTitle(pathname, currentAppName);
  const isSettingsPage = pathname.startsWith("/settings");

  useEffect(() => {
    setIsClient(true);
    const updateAppConfigFromServer = async () => {
      try {
        const response = await fetch('/api/settings/system-settings');
        if (response.ok) {
          const settings: SystemSetting[] = await response.json();
          const settingsMap = new Map(settings.map(s => [s.key, s.value]));
          
          const appNameSetting = settingsMap.get('appName');
          const logoSetting = settingsMap.get('appLogoDataUrl');
          const primaryGradientStartSetting = settingsMap.get('primaryGradientStart');
          const primaryGradientEndSetting = settingsMap.get('primaryGradientEnd');
          
          setCurrentAppName(appNameSetting || DEFAULT_APP_NAME);
          setAppLogoUrl(logoSetting || null);

          // Apply primary colors dynamically
          const startColor = primaryGradientStartSetting || DEFAULT_PRIMARY_GRADIENT_START;
          const endColor = primaryGradientEndSetting || DEFAULT_PRIMARY_GRADIENT_END;

          document.documentElement.style.setProperty('--primary-gradient-start-l', startColor);
          document.documentElement.style.setProperty('--primary-gradient-end-l', endColor);
          document.documentElement.style.setProperty('--primary-gradient-start-d', startColor); // Using same for dark for now
          document.documentElement.style.setProperty('--primary-gradient-end-d', endColor);   // Using same for dark for now
          document.documentElement.style.setProperty('--primary', `hsl(${startColor})`); // Update base primary too


        } else {
          console.warn("Failed to fetch server-side system settings, using defaults.");
          // Apply defaults if fetch fails
          document.documentElement.style.setProperty('--primary-gradient-start-l', DEFAULT_PRIMARY_GRADIENT_START);
          document.documentElement.style.setProperty('--primary-gradient-end-l', DEFAULT_PRIMARY_GRADIENT_END);
          document.documentElement.style.setProperty('--primary-gradient-start-d', DEFAULT_PRIMARY_GRADIENT_START);
          document.documentElement.style.setProperty('--primary-gradient-end-d', DEFAULT_PRIMARY_GRADIENT_END);
          document.documentElement.style.setProperty('--primary', `hsl(${DEFAULT_PRIMARY_GRADIENT_START})`);
        }
      } catch (error) {
        console.error("Error fetching server-side system settings:", error);
        // Apply defaults on error
        document.documentElement.style.setProperty('--primary-gradient-start-l', DEFAULT_PRIMARY_GRADIENT_START);
        document.documentElement.style.setProperty('--primary-gradient-end-l', DEFAULT_PRIMARY_GRADIENT_END);
        document.documentElement.style.setProperty('--primary-gradient-start-d', DEFAULT_PRIMARY_GRADIENT_START);
        document.documentElement.style.setProperty('--primary-gradient-end-d', DEFAULT_PRIMARY_GRADIENT_END);
        document.documentElement.style.setProperty('--primary', `hsl(${DEFAULT_PRIMARY_GRADIENT_START})`);
      }
    };
    
    updateAppConfigFromServer(); 

    const handleAppConfigChange = (event: Event) => {
        const customEvent = event as CustomEvent<{ appName?: string; logoUrl?: string | null; primaryGradientStart?: string; primaryGradientEnd?: string }>;
        if (customEvent.detail) {
            if (customEvent.detail.appName) setCurrentAppName(customEvent.detail.appName);
            if (customEvent.detail.logoUrl !== undefined) setAppLogoUrl(customEvent.detail.logoUrl);
            if (customEvent.detail.primaryGradientStart && customEvent.detail.primaryGradientEnd) {
                document.documentElement.style.setProperty('--primary-gradient-start-l', customEvent.detail.primaryGradientStart);
                document.documentElement.style.setProperty('--primary-gradient-end-l', customEvent.detail.primaryGradientEnd);
                document.documentElement.style.setProperty('--primary-gradient-start-d', customEvent.detail.primaryGradientStart);
                document.documentElement.style.setProperty('--primary-gradient-end-d', customEvent.detail.primaryGradientEnd);
                document.documentElement.style.setProperty('--primary', `hsl(${customEvent.detail.primaryGradientStart})`);
            }
        } else {
            // Full refetch if no specific detail
            updateAppConfigFromServer();
        }
    };
    
    window.addEventListener('appConfigChanged', handleAppConfigChange);
    return () => {
      window.removeEventListener('appConfigChanged', handleAppConfigChange);
    };
  }, []);


  if (pathname === "/auth/signin") {
    return <>{children}</>;
  }

  const renderLogo = (isCollapsed: boolean) => {
    if (isClient && appLogoUrl) {
      return <Image src={appLogoUrl} alt="App Logo" width={isCollapsed ? 32 : 32} height={isCollapsed ? 32 : 32} className={isCollapsed ? "h-8 w-8 object-contain" : "h-8 w-8 object-contain"} data-ai-hint="company logo" />;
    }
    return DEFAULT_LOGO_ICON;
  };

  return (
    <SetupFlowHandler>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" variant="sidebar" className="border-r" data-sidebar="sidebar">
          <SidebarHeader className="p-4 flex items-center justify-center h-16">
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
          <Separator className="my-0" />
          <SidebarContent className="p-2 pr-1">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-4 border-t group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {currentAppName}</p>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col bg-background">
          <Header pageTitle={pageTitle} />
          <main className="flex-1 overflow-y-auto">
            {isSettingsPage ? (
              <SettingsLayout>{children}</SettingsLayout>
            ) : (
              <div className="p-4 md:p-6 lg:p-8">{children}</div>
            )}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SetupFlowHandler>
  );
}
