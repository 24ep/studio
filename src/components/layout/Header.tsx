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
import { Sun, Moon, LogOut, UserCircle, LogIn, KeyRound, Edit3 } from "lucide-react"; 
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';
import { EditUserModal, type EditUserFormValues } from '@/components/users/EditUserModal';
import { toast } from "react-hot-toast";
import type { UserProfile } from "@/lib/types";


const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName';
const DEFAULT_APP_NAME = "CandiTrack";

export function Header({ pageTitle: initialPageTitle }: { pageTitle: string }) {
  const { isMobile } = useSidebar();
  const { data: session, status, update: updateSession } = useSession();
  const [mounted, setMounted] = useState(false);
  const [currentAppName, setCurrentAppName] = useState<string>(DEFAULT_APP_NAME);
  const [effectivePageTitle, setEffectivePageTitle] = useState(initialPageTitle);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAppName = localStorage.getItem(APP_CONFIG_APP_NAME_KEY);
      setCurrentAppName(storedAppName || DEFAULT_APP_NAME);
    }
  }, []);

  useEffect(() => {
    if (initialPageTitle === DEFAULT_APP_NAME && currentAppName !== DEFAULT_APP_NAME) {
      setEffectivePageTitle(currentAppName);
    } else {
      setEffectivePageTitle(initialPageTitle);
    }
  }, [initialPageTitle, currentAppName]);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const handleEditProfile = async (userId: string, data: EditUserFormValues) => {
    if (!session?.user) return;
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }
      toast.success("Profile Updated");
      
      // Trigger session update if name or email changed
      if (session.user.name !== result.name || session.user.email !== result.email) {
        await updateSession({
          name: result.name,
          email: result.email,
        });
      }
      setIsEditProfileModalOpen(false);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };


  if (!mounted || status === "loading") { 
    return (
      <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          {isMobile && <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />}
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        </div>
      </header>
    );
  }

  const user = session?.user;

  return (
    <>
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
                    {user.email && ( <p className="text-xs leading-none text-muted-foreground"> {user.email} </p> )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => setIsEditProfileModalOpen(true)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsChangePasswordModalOpen(true)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
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
      {user && (
        <>
          <ChangePasswordModal 
            isOpen={isChangePasswordModalOpen} 
            onOpenChange={setIsChangePasswordModalOpen} 
          />
          <EditUserModal
            isOpen={isEditProfileModalOpen}
            onOpenChange={setIsEditProfileModalOpen}
            onEditUser={handleEditProfile}
            user={session?.user as UserProfile | null} 
            isSelfEdit={true} 
          />
        </>
      )}
    </>
  );
}
