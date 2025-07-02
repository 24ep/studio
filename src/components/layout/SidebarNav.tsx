"use client"
import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { sidebarConfig } from "./SidebarNavConfig";
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  LogOut, 
  User, 
  Crown, 
  Briefcase, 
  Users, 
  Settings,
  Bell,
  HelpCircle
} from "lucide-react";
import { signOut } from "next-auth/react";

const APP_LOGO_DATA_URL_KEY = 'appLogoDataUrl';
const APP_CONFIG_APP_NAME_KEY = 'appConfigAppName';
const DEFAULT_APP_NAME = "CandiTrack";
const DEFAULT_LOGO_ICON = (
  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
    <span className="text-white font-bold text-lg">CT</span>
  </div>
);

// Utility functions
function getRoleIcon(role: string) {
  switch (role) {
    case 'Admin':
      return <Crown className="h-4 w-4 text-yellow-500" />;
    case 'Hiring Manager':
      return <Briefcase className="h-4 w-4 text-blue-500" />;
    case 'Recruiter':
      return <Users className="h-4 w-4 text-green-500" />;
    default:
      return <User className="h-4 w-4 text-gray-500" />;
  }
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case 'Admin':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Hiring Manager':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Recruiter':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Subcomponents
const Branding: React.FC<{ appLogoUrl: string | null, appName: string }> = ({ appLogoUrl, appName }) => (
  <div className="sidebar-branding border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
    <Link href="/" className="flex flex-row items-center gap-3 px-6 py-6 hover:bg-gray-50 transition-colors duration-200">
      {appLogoUrl ? (
        <Image src={appLogoUrl} alt="App Logo" width={40} height={40} className="h-10 w-10 object-contain rounded-xl shadow-sm" />
      ) : (
        DEFAULT_LOGO_ICON
      )}
      <div className="flex flex-col">
        <span className="app-name text-xl font-bold text-gray-900 tracking-tight">
          {appName}
        </span>
        <span className="text-xs text-gray-500 font-medium">Recruitment Platform</span>
      </div>
    </Link>
  </div>
);

const UserProfile: React.FC<{ user: any }> = ({ user }) => {
  const userRole = user?.role;
  return (
    <div className="px-4 py-4 border-b border-gray-100">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
          <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
            {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {user.name || 'User'}
          </p>
          <p className="text-xs text-gray-600 truncate">
            {user.email}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {getRoleIcon(userRole || '')}
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getRoleBadgeColor(userRole || '')}`}>
              {userRole}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavGroups: React.FC<{ userRole: string | undefined, pathname: string }> = ({ userRole, pathname }) => (
  <div className="flex-1 px-3 py-4 space-y-2">
    {sidebarConfig.map((group) => (
      <SidebarGroup key={group.label}>
        <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-gray-500 tracking-wider uppercase">
          {group.label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="space-y-1">
            {group.items
              .filter(item => !item.adminOnly || userRole === "Admin")
              .map(item => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      aria-label={item.label}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium group relative overflow-hidden
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
                        }
                        ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'}
                      `}
                    >
                      <Link href={item.href} className="flex items-center gap-3 w-full">
                        <div className={`p-1.5 rounded-md transition-all duration-200 ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200 group-hover:text-gray-700'
                        }`}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    ))}
  </div>
);

const QuickActions: React.FC = () => (
  <div className="px-3 py-4 border-t border-gray-100">
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-full flex items-center gap-2 justify-start"
        onClick={() => signOut()}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
      <Link href="/settings/system-preferences" passHref legacyBehavior>
        <Button variant="ghost" size="sm" className="w-full flex items-center gap-2 justify-start">
          <Settings className="h-4 w-4" />
          System Preferences
        </Button>
      </Link>
      <Link href="/settings/notifications" passHref legacyBehavior>
        <Button variant="ghost" size="sm" className="w-full flex items-center gap-2 justify-start">
          <Bell className="h-4 w-4" />
          Notifications
        </Button>
      </Link>
      <Link href="/docs" passHref legacyBehavior>
        <Button variant="ghost" size="sm" className="w-full flex items-center gap-2 justify-start">
          <HelpCircle className="h-4 w-4" />
          Help & Docs
        </Button>
      </Link>
    </div>
  </div>
);

// Main SidebarNav component
const SidebarNav: React.FC = React.memo(function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const [appLogoUrl, setAppLogoUrl] = React.useState<string | null>(null);
  const [currentAppName, setCurrentAppName] = React.useState<string>(DEFAULT_APP_NAME);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLogo = localStorage.getItem(APP_LOGO_DATA_URL_KEY);
      const storedAppName = localStorage.getItem(APP_CONFIG_APP_NAME_KEY);
      setAppLogoUrl(storedLogo);
      setCurrentAppName(storedAppName || DEFAULT_APP_NAME);

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
    <Sidebar className="bg-white border-r border-gray-200 min-h-screen flex flex-col shadow-sm" data-sidebar="sidebar">
      <Branding appLogoUrl={appLogoUrl} appName={currentAppName} />
      {session?.user && <UserProfile user={session.user} />}
      <NavGroups userRole={userRole} pathname={pathname} />
      <QuickActions />
    </Sidebar>
  );
});

export default SidebarNav;
