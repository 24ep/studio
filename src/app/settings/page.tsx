// src/app/settings/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Palette, 
  Zap, 
  KanbanSquare, 
  DatabaseZap, 
  Settings2, 
  SlidersHorizontal, 
  UsersRound, 
  UserCog, 
  Code2, 
  ListOrdered,
  ArrowRight
} from 'lucide-react';
import type { PlatformModuleId } from '@/lib/types';

const settingsItems = [
  { href: "/settings/preferences", label: "Preferences", icon: Palette, description: "Customize your user interface and display preferences." },
  { href: "/settings/system-settings", label: "Integrations", icon: Zap, description: "Configure webhooks, SMTP, AI settings, and system integrations." },
  { href: "/settings/stages", label: "Recruitment Stages", icon: KanbanSquare, description: "Manage your recruitment workflow stages and pipelines.", permissionId: 'RECRUITMENT_STAGES_MANAGE' as PlatformModuleId },
  { href: "/settings/data-models", label: "Data Models (Client)", icon: DatabaseZap, description: "Configure client-side data model preferences.", permissionId: 'DATA_MODELS_MANAGE' as PlatformModuleId },
  { href: "/settings/custom-fields", label: "Custom Fields (Server)", icon: Settings2, description: "Define server-side custom field definitions.", permissionId: 'CUSTOM_FIELDS_MANAGE' as PlatformModuleId },
  { href: "/settings/webhook-mapping", label: "Webhook Payload Mapping", icon: SlidersHorizontal, description: "Configure webhook data field mappings.", permissionId: 'WEBHOOK_MAPPING_MANAGE' as PlatformModuleId },
  { href: "/users", label: "Manage Users", icon: UsersRound, description: "Add, edit, or remove system users.", adminOnly: true },
  { href: "/settings/user-groups", label: "Manage User Groups", icon: UserCog, description: "Configure roles and permissions for user groups.", permissionId: 'USER_GROUPS_MANAGE' as PlatformModuleId, adminOnlyOrPermission: true },
  { href: "/api-docs", label: "API Docs", icon: Code2, description: "Developer API reference and documentation." },
  { href: "/logs", label: "Logs", icon: ListOrdered, description: "View system and audit logs.", adminOnly: true },
];

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const canAccess = (item: { adminOnly?: boolean, permissionId?: PlatformModuleId, adminOnlyOrPermission?: boolean }) => {
    if (!isClient || sessionStatus !== 'authenticated') return false;
    if (item.adminOnly && session?.user?.role !== 'Admin') return false;
    if (item.adminOnlyOrPermission) {
      if (session?.user?.role === 'Admin') return true;
      if (item.permissionId && session?.user?.modulePermissions?.includes(item.permissionId)) return true;
      return false;
    }
    if (item.permissionId && session?.user?.role !== 'Admin' && !session?.user?.modulePermissions?.includes(item.permissionId)) return false;
    return true;
  };

  const accessibleItems = isClient ? settingsItems.filter(item => canAccess(item)) : [];

  if (sessionStatus === 'loading' || !isClient) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleItems.map((item) => (
          <Card 
            key={item.href} 
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 group"
            onClick={() => router.push(item.href)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">{item.label}</CardTitle>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {item.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      {accessibleItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No settings available for your current permissions.</p>
        </div>
      )}
    </div>
  );
}
