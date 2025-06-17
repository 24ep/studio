
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


const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName';
const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_LOGO_ICON = <Package2 className="h-6 w-6" />;


function getPageTitle(pathname: string): string {
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
  if (pathname.startsWith("/users")) return "Manage Users";
  if (pathname.startsWith("/my-tasks")) return "My Task Board";
  if (pathname.startsWith("/settings/preferences")) return "Preferences";
  if (pathname.startsWith("/settings/integrations")) return "Integrations";
  if (pathname.startsWith("/settings/stages")) return "Recruitment Stages";
  if (pathname.startsWith("/settings/data-models")) return "Data Model Preferences";
  if (pathname.startsWith("/settings/webhook-mapping")) return "Webhook Payload Mapping";
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

  useEffect(() => {
    setIsClient(true);
    const updateAppConfig = () => {
      if (typeof window !== 'undefined') {
        const storedLogo = localStorage.getItem(APP_LOGO_DATA_URL_KEY);
        setAppLogoUrl(storedLogo);
        const storedAppName = localStorage.getItem(APP_CONFIG_APP_NAME_KEY);
        setCurrentAppName(storedAppName || DEFAULT_APP_NAME);
      }
    };

    updateAppConfig(); // Initial load

    const handleAppConfigChange = (event: Event) => {
        const customEvent = event as CustomEvent<{ appName?: string; logoUrl?: string | null }>;
        if (customEvent.detail) {
            if (customEvent.detail.appName) {
                setCurrentAppName(customEvent.detail.appName);
            }
            // Check for logoUrl specifically, could be null if reset
            if (customEvent.detail.logoUrl !== undefined) { 
                 setAppLogoUrl(customEvent.detail.logoUrl);
            }
        } else {
            // Fallback if event detail is not as expected
            updateAppConfig();
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
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SetupFlowHandler>
  );
}
