"use client"
import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { useSession } from "next-auth/react";
import { sidebarConfig as staticSidebarConfig } from "./SidebarNavConfig";
import Link from "next/link";
import Image from "next/image";
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
  <div className="sidebar-branding border-b border-border bg-background">
    <Link href="/" className="flex flex-row items-center gap-3 px-3 py-3 hover:bg-muted transition-colors duration-200">
      {appLogoUrl ? (
        <Image src={appLogoUrl} alt="App Logo" width={40} height={40} className="h-10 w-10 object-contain rounded-xl shadow-sm" />
      ) : (
        DEFAULT_LOGO_ICON
      )}
      <div className="flex flex-col">
        <span className="app-name text-xl font-bold text-foreground tracking-tight">
          {appName}
        </span>
      </div>
    </Link>
  </div>
);

const NavGroups: React.FC<{ userRole: string | undefined, pathname: string, sidebarConfig: any[] }> = ({ userRole, pathname, sidebarConfig }) => (
  <nav className="flex-1 flex flex-col gap-2 px-2 py-4">
    {sidebarConfig.flatMap((group: any) =>
      group.items
        .filter((item: any) => !item.adminOnly || userRole === "Admin")
        .map((item: any) => {
          const isActive = pathname === item.href;
          const Icon = typeof item.icon === 'string' ? Users : item.icon;
          return (
            <Link href={item.href} key={item.href} legacyBehavior>
              <a
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-base
                  ${isActive ? 'bg-primary text-white shadow' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })
    )}
  </nav>
);

// Main SidebarNav component
const SidebarNav: React.FC = React.memo(function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const user = session?.user;

  const [appLogoUrl, setAppLogoUrl] = React.useState<string | null>(null);
  const [currentAppName, setCurrentAppName] = React.useState<string>(DEFAULT_APP_NAME);
  const [sidebarConfig, setSidebarConfig] = React.useState<any[]>(staticSidebarConfig);
  const [sidebarLoading, setSidebarLoading] = React.useState<boolean>(true);

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
      // Fetch sidebar config from API
      fetch('/api/settings/sidebar-config')
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          if (Array.isArray(data)) {
            setSidebarConfig(data);
          } else if (data && Array.isArray(data.default)) {
            setSidebarConfig(data.default);
          } else {
            console.warn('Sidebar config API returned unexpected structure:', data);
            setSidebarConfig(staticSidebarConfig);
          }
        })
        .catch((err) => {
          console.warn('Sidebar config API fetch failed, using static config.', err);
          setSidebarConfig(staticSidebarConfig);
        })
        .finally(() => setSidebarLoading(false));
      return () => {
        window.removeEventListener('appConfigChanged', handleAppConfigChange);
      };
    }
  }, []);

  return (
    <Sidebar className="bg-background border-r border-border min-h-screen flex flex-col shadow-sm w-64 rounded-none border-t-0 border-b-0 border-l-0" data-sidebar="sidebar">
      <Branding appLogoUrl={appLogoUrl} appName={currentAppName} />
      {sidebarLoading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">Loading menu...</div>
      ) : (
        <NavGroups userRole={userRole} pathname={pathname} sidebarConfig={sidebarConfig} />
      )}
    </Sidebar>
  );
});

export default SidebarNav;
