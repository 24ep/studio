
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

// NEW Default primary gradient HSL strings (cyan-to-blue)
const DEFAULT_PRIMARY_GRADIENT_START = "179 67% 66%";
const DEFAULT_PRIMARY_GRADIENT_END = "238 74% 61%";

// Default Sidebar colors (HSL strings) - using the NEW primary gradient defaults
const DEFAULT_SIDEBAR_COLORS: Record<SystemSettingKey, string> = {
  sidebarBgStartL: "220 25% 97%", sidebarBgEndL: "220 20% 94%", sidebarTextL: "220 25% 30%",
  sidebarActiveBgStartL: DEFAULT_PRIMARY_GRADIENT_START, sidebarActiveBgEndL: DEFAULT_PRIMARY_GRADIENT_END, sidebarActiveTextL: "0 0% 100%",      
  sidebarHoverBgL: "220 10% 92%", sidebarHoverTextL: "220 25% 25%", sidebarBorderL: "220 15% 85%",
  sidebarBgStartD: "220 15% 12%", sidebarBgEndD: "220 15% 9%", sidebarTextD: "210 30% 85%",
  sidebarActiveBgStartD: DEFAULT_PRIMARY_GRADIENT_START, sidebarActiveBgEndD: DEFAULT_PRIMARY_GRADIENT_END, sidebarActiveTextD: "0 0% 100%",      
  sidebarHoverBgD: "220 15% 20%", sidebarHoverTextD: "210 30% 90%", sidebarBorderD: "220 15% 18%",
  // Ensure other keys expected by AppLayout are also here if needed, or handle undefined gracefully
  appName: DEFAULT_APP_NAME, appLogoDataUrl: '', appThemePreference: 'system', 
  primaryGradientStart: DEFAULT_PRIMARY_GRADIENT_START, primaryGradientEnd: DEFAULT_PRIMARY_GRADIENT_END,
  smtpHost: '', smtpPort: '', smtpUser: '', smtpSecure: 'true', smtpFromEmail: '',
  n8nResumeWebhookUrl: '', n8nGenericPdfWebhookUrl: '', geminiApiKey: '',
  loginPageBackgroundType: 'default', loginPageBackgroundImageUrl: '', 
  loginPageBackgroundColor1: '#F0F4F7', loginPageBackgroundColor2: '#3F51B5'
};


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

function applySystemStyles(settingsMap: Map<string, string | null>) {
    const applyStyle = (variableName: string, settingKey: SystemSettingKey, defaultValue: string) => {
        const value = settingsMap.get(settingKey) || defaultValue;
        if (typeof document !== 'undefined' && value) {
             document.documentElement.style.setProperty(variableName, value);
        }
    };

    // Primary Colors
    applyStyle('--primary-gradient-start-l', 'primaryGradientStart', DEFAULT_PRIMARY_GRADIENT_START);
    applyStyle('--primary-gradient-end-l', 'primaryGradientEnd', DEFAULT_PRIMARY_GRADIENT_END);
    applyStyle('--primary-gradient-start-d', 'primaryGradientStart', DEFAULT_PRIMARY_GRADIENT_START); 
    applyStyle('--primary-gradient-end-d', 'primaryGradientEnd', DEFAULT_PRIMARY_GRADIENT_END);   
    const primaryStartForVar = settingsMap.get('primaryGradientStart') || DEFAULT_PRIMARY_GRADIENT_START;
    if (typeof document !== 'undefined' && primaryStartForVar) {
        document.documentElement.style.setProperty('--primary', `hsl(${primaryStartForVar})`);
    }


    // Sidebar Light Theme
    applyStyle('--sidebar-bg-start-l', 'sidebarBgStartL', DEFAULT_SIDEBAR_COLORS.sidebarBgStartL);
    applyStyle('--sidebar-bg-end-l', 'sidebarBgEndL', DEFAULT_SIDEBAR_COLORS.sidebarBgEndL);
    applyStyle('--sidebar-text-l', 'sidebarTextL', DEFAULT_SIDEBAR_COLORS.sidebarTextL);
    applyStyle('--sidebar-active-bg-start-l', 'sidebarActiveBgStartL', settingsMap.get('primaryGradientStart') || DEFAULT_PRIMARY_GRADIENT_START);
    applyStyle('--sidebar-active-bg-end-l', 'sidebarActiveBgEndL', settingsMap.get('primaryGradientEnd') || DEFAULT_PRIMARY_GRADIENT_END);
    applyStyle('--sidebar-active-text-l', 'sidebarActiveTextL', DEFAULT_SIDEBAR_COLORS.sidebarActiveTextL);
    applyStyle('--sidebar-hover-bg-l', 'sidebarHoverBgL', DEFAULT_SIDEBAR_COLORS.sidebarHoverBgL);
    applyStyle('--sidebar-hover-text-l', 'sidebarHoverTextL', DEFAULT_SIDEBAR_COLORS.sidebarHoverTextL);
    applyStyle('--sidebar-border-l', 'sidebarBorderL', DEFAULT_SIDEBAR_COLORS.sidebarBorderL);

    // Sidebar Dark Theme
    applyStyle('--sidebar-bg-start-d', 'sidebarBgStartD', DEFAULT_SIDEBAR_COLORS.sidebarBgStartD);
    applyStyle('--sidebar-bg-end-d', 'sidebarBgEndD', DEFAULT_SIDEBAR_COLORS.sidebarBgEndD);
    applyStyle('--sidebar-text-d', 'sidebarTextD', DEFAULT_SIDEBAR_COLORS.sidebarTextD);
    applyStyle('--sidebar-active-bg-start-d', 'sidebarActiveBgStartD', settingsMap.get('primaryGradientStart') || DEFAULT_PRIMARY_GRADIENT_START);
    applyStyle('--sidebar-active-bg-end-d', 'sidebarActiveBgEndD', settingsMap.get('primaryGradientEnd') || DEFAULT_PRIMARY_GRADIENT_END);
    applyStyle('--sidebar-active-text-d', 'sidebarActiveTextD', DEFAULT_SIDEBAR_COLORS.sidebarActiveTextD);
    applyStyle('--sidebar-hover-bg-d', 'sidebarHoverBgD', DEFAULT_SIDEBAR_COLORS.sidebarHoverBgD);
    applyStyle('--sidebar-hover-text-d', 'sidebarHoverTextD', DEFAULT_SIDEBAR_COLORS.sidebarHoverTextD);
    applyStyle('--sidebar-border-d', 'sidebarBorderD', DEFAULT_SIDEBAR_COLORS.sidebarBorderD);
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
          
          setCurrentAppName(settingsMap.get('appName') || DEFAULT_APP_NAME);
          setAppLogoUrl(settingsMap.get('appLogoDataUrl') || null);
          applySystemStyles(settingsMap);

        } else {
          console.warn("Failed to fetch server-side system settings, using defaults.");
          const defaultSettingsMap = new Map(Object.entries(DEFAULT_SIDEBAR_COLORS).map(([key, value]) => [key as SystemSettingKey, value as string | null]));
          defaultSettingsMap.set('primaryGradientStart', DEFAULT_PRIMARY_GRADIENT_START);
          defaultSettingsMap.set('primaryGradientEnd', DEFAULT_PRIMARY_GRADIENT_END);
          applySystemStyles(defaultSettingsMap);
        }
      } catch (error) {
        console.error("Error fetching server-side system settings:", error);
        const defaultSettingsMap = new Map(Object.entries(DEFAULT_SIDEBAR_COLORS).map(([key, value]) => [key as SystemSettingKey, value as string | null]));
        defaultSettingsMap.set('primaryGradientStart', DEFAULT_PRIMARY_GRADIENT_START);
        defaultSettingsMap.set('primaryGradientEnd', DEFAULT_PRIMARY_GRADIENT_END);
        applySystemStyles(defaultSettingsMap);
      }
    };
    
    updateAppConfigFromServer(); 

    const handleAppConfigChange = (event: Event) => {
        // Re-fetch all settings to apply colors and other configs
        updateAppConfigFromServer();
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
