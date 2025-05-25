
"use client";
import type { ReactNode } from "react";
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
import { useSession } from "next-auth/react";

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/candidates")) return "Candidates";
  if (pathname.startsWith("/positions")) return "Positions";
  if (pathname.startsWith("/users")) return "Manage Users";
  if (pathname.startsWith("/settings/preferences")) return "Preferences";
  if (pathname.startsWith("/settings/integrations")) return "Integrations";
  if (pathname.startsWith("/setup")) return "Application Setup";
  if (pathname.startsWith("/docker-deployment")) return "Docker & Deployment";
  if (pathname.startsWith("/system-status")) return "System Status";
  if (pathname.startsWith("/settings")) return "Settings"; 
  if (pathname.startsWith("/api-docs")) return "API Documentation";
  if (pathname.startsWith("/logs")) return "Application Logs";
  if (pathname.startsWith("/auth/signin")) return "Sign In";
  return "NCC Candidate Management";
}


export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const { data: session, status } = useSession();

  if (pathname === "/auth/signin") {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className="p-4 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-2 font-semibold text-primary group-data-[collapsible=icon]:hidden">
            <Package2 className="h-6 w-6" />
            <span>NCC Candidate Management</span>
          </Link>
          <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full hidden">
             <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
              <Package2 className="h-6 w-6" />
            </Link>
          </div>
          <SidebarTrigger className="hidden md:group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
        <Separator className="my-0" />
        <SidebarContent className="p-2 pr-1">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 border-t group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} NCC Candidate Management</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col bg-background">
        <Header pageTitle={pageTitle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
    

    
