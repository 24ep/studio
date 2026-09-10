"use client";

import React from 'react';
import {
  Activity,
  BadgeCheck,
  BrainCircuit,
  Building,
  CheckCircle,
  Database,
  FileText,
  Key,
  LogIn,
  Mail,
  Megaphone,
  Search,
  Settings,
  ShieldAlert,
  Smartphone,
  UploadCloud,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SystemSettingsMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SystemSettingsMenuGroup {
  group: string;
  items: SystemSettingsMenuItem[];
}

interface SystemSettingsNavigationProps {
  activeTab: string;
  isAdmin: boolean;
  onTabChange: (tabId: string) => void;
}

const menuItems: SystemSettingsMenuGroup[] = [
  {
    group: 'General',
    items: [
      { id: 'organize', label: 'Organization', icon: Building },
      { id: 'domain-verification', label: 'Domain Verification', icon: BadgeCheck },
      { id: 'features', label: 'Feature Flags', icon: Settings },
    ],
  },
  {
    group: 'Communication',
    items: [
      { id: 'broadcast-banner', label: 'Broadcast Channels', icon: Megaphone },
      { id: 'email-server', label: 'Email Server', icon: Mail },
      { id: 'email-templates', label: 'Email Templates', icon: FileText },
    ],
  },
  {
    group: 'Security & Protection',
    items: [
      { id: 'login-methods', label: 'Login Methods', icon: LogIn },
      { id: 'security', label: 'Security Controls', icon: ShieldAlert },
      { id: 'system-api-keys', label: 'API Keys', icon: Key },
    ],
  },
  {
    group: 'App Config',
    items: [
      { id: 'processing', label: 'Processing', icon: Database },
      { id: 'match-criteria', label: 'Match Criteria', icon: BrainCircuit },
      { id: 'pwa', label: 'PWA Settings', icon: Smartphone },
      { id: 'auto-close', label: 'Auto-Close', icon: CheckCircle },
    ],
  },
  {
    group: 'AI & Intelligence',
    items: [
      { id: 'ai-search', label: 'AI Search', icon: Search },
      { id: 'knowledge-base', label: 'Knowledge Base', icon: Database },
      { id: 'ai-api-keys', label: 'AI API Keys', icon: Key },
      { id: 'ai-prompts', label: 'AI Prompts', icon: BrainCircuit },
      { id: 'digital-footprint', label: 'Digital Footprint', icon: ShieldAlert },
    ],
  },
  {
    group: 'Monitoring',
    items: [
      { id: 'monitoring', label: 'Monitoring', icon: Activity },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'azure', label: 'Azure Integration', icon: UploadCloud },
    ],
  },
];

function getVisibleMenuGroups(isAdmin: boolean) {
  return menuItems
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.id !== 'system-api-keys' || isAdmin),
    }))
    .filter((group) => group.items.length > 0);
}

export function SystemSettingsMobileNavigation({
  activeTab,
  isAdmin,
  onTabChange,
}: SystemSettingsNavigationProps) {
  const visibleGroups = getVisibleMenuGroups(isAdmin);

  return (
    <div className="block md:hidden mb-4 p-4 border-b bg-muted/20">
      <Select value={activeTab} onValueChange={onTabChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <SelectValue placeholder="Select Settings Tab" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {visibleGroups.map((group) => (
            <React.Fragment key={group.group}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/30">
                {group.group}
              </div>
              {group.items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              ))}
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SystemSettingsSidebarNavigation({
  activeTab,
  isAdmin,
  onTabChange,
}: SystemSettingsNavigationProps) {
  const visibleGroups = getVisibleMenuGroups(isAdmin);

  return (
    <div className="w-64 border-r bg-muted/10 flex-col hidden md:flex">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {visibleGroups.map((group) => (
            <div key={group.group}>
              <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group.group}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      activeTab === item.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
