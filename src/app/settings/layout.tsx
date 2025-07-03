// src/app/settings/layout.tsx
"use client";

import * as React from "react";
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Added useRouter import
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Settings,
  Palette,
  Zap,
  KanbanSquare,
  DatabaseZap,
  Settings2 as CustomFieldsIcon, // Renamed to avoid conflict
  SlidersHorizontal,
  BellRing,
  UsersRound,
  Code2,
  ListOrdered,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import type { SettingsNavigationItem, PlatformModuleId } from '@/lib/types';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const settingsNavItems: SettingsNavigationItem[] = [
  { href: "/settings/system-settings", label: "System Settings", icon: Settings, description: "System-wide configuration.", permissionId: 'SYSTEM_SETTINGS_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true },
  { href: "/settings/system-preferences", label: "Preferences", icon: Palette, description: "Global branding, theme, and logo settings.", permissionId: 'SYSTEM_SETTINGS_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true },
  { href: "/settings/stages", label: "Recruitment Stages", icon: KanbanSquare, description: "Define your hiring pipeline.", permissionId: 'RECRUITMENT_STAGES_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true },
  { href: "/settings/data-models", label: "Data Model UI", icon: DatabaseZap, description: "Customize UI for data attributes.", permissionId: 'USER_PREFERENCES_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true },
  { href: "/settings/custom-fields", label: "Custom Fields", icon: CustomFieldsIcon, description: "Define custom fields for entities.", permissionId: 'CUSTOM_FIELDS_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true },
  { href: "/settings/webhook-mapping", label: "Webhook Mapping", icon: SlidersHorizontal, description: "Map incoming webhook data.", permissionId: 'WEBHOOK_MAPPING_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true },
  { href: "/settings/user-groups", label: "Roles & Permissions", icon: ShieldCheck, description: "Manage user roles and permissions.", permissionId: 'USER_GROUPS_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true },
  { href: "/settings/notifications", label: "Notification Settings", icon: BellRing, description: "Configure system notifications.", permissionId: 'NOTIFICATION_SETTINGS_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true },
  { href: "/settings/users", label: "Manage Users", icon: UsersRound, description: "Add, edit, or remove users.", permissionId: 'USERS_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true },
  { href: "/settings/api-docs", label: "API Documentation", icon: Code2, description: "Developer API reference." },
  { href: "/settings/logs", label: "Application Logs", icon: ListOrdered, description: "View system and audit logs.", permissionId: 'LOGS_VIEW' as PlatformModuleId, adminOnlyOrPermission: true },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const canAccess = React.useCallback((item: SettingsNavigationItem) => {
    if (!isClient || status !== 'authenticated' || !session?.user) return false;
    const userRole = session.user.role || 'Recruiter'; // Default fallback
    const modulePermissions = session.user.modulePermissions || [];

    if (item.adminOnly && userRole !== 'Admin') return false;
    if (item.adminOnlyOrPermission) { 
      if (userRole === 'Admin') return true;
      if (item.permissionId && modulePermissions.includes(item.permissionId)) return true;
      return false;
    }
    if (item.permissionId && userRole !== 'Admin' && !modulePermissions.includes(item.permissionId)) return false;
    return true;
  }, [isClient, status, session?.user?.role, session?.user?.modulePermissions]);
  
  const visibleNavItems = React.useMemo(() => {
    // Ensure settingsNavItems is an array before calling filter
    const safeSettingsNavItems = Array.isArray(settingsNavItems) ? settingsNavItems : [];
    return safeSettingsNavItems.filter(item => canAccess(item));
  }, [canAccess]);

  if (status === "loading" && !isClient) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (status === "unauthenticated" && isClient) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-lg text-destructive">You are not authenticated. Please sign in.</p>
      </div>
    );
  }
  
  // Check if user has access to ANY settings page. If not, redirect.
  const canAccessAnySettings = visibleNavItems.length > 0;
  if (status === "authenticated" && isClient && !canAccessAnySettings && session?.user) {
      // If the user is on a settings page but shouldn't be, redirect them.
      if (pathname.startsWith("/settings")) {
          router.replace("/?message=NoSettingsAccess");
          return (<div className="flex h-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-2">Redirecting...</p></div>);
      }
  }


  return (
    <div className="flex h-full bg-muted/30">
      <aside className="hidden md:flex md:flex-col md:w-80 border-r">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center text-foreground">
            <Settings className="mr-2 h-5 w-5 text-primary" /> Application Settings
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Manage all application configurations and system settings.</p>
        </div>
        <ScrollArea className="flex-1">
          <nav className="py-2 px-2">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-start rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-primary",
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="mr-3 h-5 w-5 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span>{item.label}</span>
                  <span className={cn(
                     "text-xs",
                     pathname === item.href || pathname.startsWith(item.href + '/') ? "text-primary/80" : "text-muted-foreground/80"
                    )}>{item.description || ''}</span>
                </div>
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </aside>
      <div className="flex-1 overflow-y-auto relative p-0">
        {/* Main content of the specific settings page will be rendered here */}
        {children}
      </div>
    </div>
  );
}

