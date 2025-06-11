
"use client";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, LogOut, UserCircle, LogIn } from "lucide-react"; 
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export function Header({ pageTitle }: { pageTitle: string }) {
  const { isMobile } = useSidebar();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [effectivePageTitle, setEffectivePageTitle] = useState(pageTitle);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setEffectivePageTitle(pageTitle); // Update title if prop changes
  }, [pageTitle]);


  // Basic theme toggle example, can be expanded with context
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  // Show skeleton while loading session or not mounted to prevent layout shifts/flicker
  if (!mounted || status === "loading") { 
    return (
      <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          {isMobile && <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />}
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" /> {/* Theme toggle placeholder */}
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" /> {/* Avatar placeholder */}
        </div>
      </header>
    );
  }

  const user = session?.user;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2">
        {isMobile && <SidebarTrigger />}
        <h1 className="text-lg font-semibold text-foreground">{effectivePageTitle}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.image || undefined} alt={user.name || "User"} data-ai-hint={user.image ? undefined : "profile person"} />
                  <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="h-5 w-5"/>}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                  {user.email && (
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Profile item removed */}
              {/* Add more items like Settings, etc. */}
              {/* <DropdownMenuSeparator /> */} {/* Removed separator if profile was the only item before logout */}
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" onClick={() => signIn()}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
