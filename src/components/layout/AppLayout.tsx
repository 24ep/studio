
"use client";
import type { ReactNode } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger, // For desktop toggle if needed
} from "@/components/ui/sidebar";
import { SidebarNav } from "./SidebarNav";
import { Header } from "./Header"; // Assuming Header is created
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package2 } from "lucide-react"; // Example App Icon

// Determine current page title - this could be more sophisticated with a context or route matching
import { usePathname } from "next/navigation";

function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/candidates")) return "Candidates";
  if (pathname.startsWith("/positions")) return "Positions";
  if (pathname.startsWith("/upload")) return "Upload Resume";
  return "CandiTrack";
}


export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" className="border-r">
        <SidebarHeader className="p-4 flex items-center justify-between">
           <Link href="/" className="flex items-center gap-2 font-semibold text-primary group-data-[collapsible=icon]:hidden">
            <Package2 className="h-6 w-6" />
            <span>CandiTrack</span>
          </Link>
          <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full hidden">
             <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
              <Package2 className="h-6 w-6" />
            </Link>
          </div>
          {/* Desktop sidebar toggle - can be removed if rail toggle is preferred */}
          <SidebarTrigger className="hidden md:group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
        <Separator className="my-0" />
        <SidebarContent className="p-2 pr-1">
          <SidebarNav />
        </SidebarContent>
        <SidebarFooter className="p-4 border-t group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CandiTrack</p>
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
