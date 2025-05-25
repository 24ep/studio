
"use client";
import React, { type ReactNode, useState, useEffect } from "react"; // Added React, useState, useEffect
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
import { SetupFlowHandler } from './SetupFlowHandler';
import Image from 'next/image'; // For better image handling

const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/candidates")) return "Candidates";
  if (pathname.startsWith("/positions")) return "Positions";
  if (pathname.startsWith("/users")) return "Manage Users";
  if (pathname.startsWith("/settings/preferences")) return "Preferences";
  if (pathname.startsWith("/settings/integrations")) return "Integrations";
  if (pathname.startsWith("/setup")) return "Application Setup";
  if (pathname.startsWith("/api-docs")) return "API Documentation";
  if (pathname.startsWith("/logs")) return "Application Logs";
  if (pathname.startsWith("/auth/signin")) return "Sign In";
  return "Candidate Matching";
}


export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const [appLogoUrl, setAppLogoUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const updateLogo = () => {
    const storedLogo = localStorage.getItem(APP_LOGO_DATA_URL_KEY);
    setAppLogoUrl(storedLogo);
  };

  useEffect(() => {
    setIsClient(true);
    updateLogo(); // Initial load

    // Listen for custom event to update logo
    window.addEventListener('logoChanged', updateLogo);
    return () => {
      window.removeEventListener('logoChanged', updateLogo);
    };
  }, []);


  if (pathname === "/auth/signin") {
    return <>{children}</>; 
  }

  return (
    <SetupFlowHandler> 
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="icon" variant="sidebar" className="border-r" data-sidebar="sidebar">
          <SidebarHeader className="p-4 flex items-center justify-center h-16"> {/* Changed justify-between to justify-center */}
            <Link href="/" className="flex items-center gap-2 font-semibold text-primary group-data-[collapsible=icon]:hidden">
              {isClient && appLogoUrl ? (
                <Image src={appLogoUrl} alt="App Logo" width={32} height={32} className="h-8 w-8 object-contain" />
              ) : (
                <Package2 className="h-6 w-6" />
              )}
              <span className="ml-1">Candidate Matching</span>
            </Link>
            <div className="hidden items-center justify-center group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:w-full">
              <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
                 {isClient && appLogoUrl ? (
                  <Image src={appLogoUrl} alt="App Logo" width={32} height={32} className="h-8 w-8 object-contain" />
                ) : (
                  <Package2 className="h-6 w-6" />
                )}
              </Link>
            </div>
            <SidebarTrigger className="hidden md:group-data-[collapsible=icon]:hidden" />
          </SidebarHeader>
          <Separator className="my-0" />
          <SidebarContent className="p-2 pr-1">
            <SidebarNav />
          </SidebarContent>
          <SidebarFooter className="p-4 border-t group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Candidate Matching</p>
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
    

    