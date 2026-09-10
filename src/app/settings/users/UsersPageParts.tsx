"use client";

import { ExternalLink, ServerCrash, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getUnderlineNavTriggerClassName } from "@/components/ui/underline-nav";

export type UsersSettingsTabId = "users" | "groups";
interface UsersPageHeaderProps { activeTab: UsersSettingsTabId; }
export function UsersPageHeader({ activeTab }: UsersPageHeaderProps) {
  return <div className="px-6 pb-0 pt-5"><div className="mb-3 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><div><h1 className="text-xl font-semibold tracking-tight text-foreground">{activeTab === 'users' ? 'User accounts' : 'Roles & Permissions'}</h1><p className="mt-0.5 text-sm text-muted-foreground">Managed centrally by Outborn Account; Hrive keeps HR and product-profile data only.</p></div></div><Button asChild size="sm"><a href={`/api/outborn/account-admin?section=${activeTab === 'groups' ? 'roles' : 'members'}`}>Manage in Outborn Account <ExternalLink className="ml-2 h-4 w-4" /></a></Button></div></div>;
}
interface UsersPageTabsProps { activeTab: UsersSettingsTabId; onTabChange: (tab: UsersSettingsTabId) => void; }
const USER_SETTINGS_TABS = [{ id: "users", label: "Users", icon: UsersRound }, { id: "groups", label: "Roles & Permissions", icon: ShieldCheck }] satisfies Array<{ id: UsersSettingsTabId; label: string; icon: typeof UsersRound }>;
export function UsersPageTabs({ activeTab, onTabChange }: UsersPageTabsProps) {
  return <div className="px-6"><div className="mb-4 flex w-full gap-6 border-b border-border">{USER_SETTINGS_TABS.map(tab => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} className={cn(getUnderlineNavTriggerClassName(activeTab === tab.id), "-mb-px h-10 px-1 text-sm")}><Icon className="h-4 w-4" /> {tab.label}</button>; })}</div></div>;
}
function UserTabErrorState({ title, description }: { title: string; description: string }) {
  return <div className="flex flex-col items-center justify-center p-8 text-center"><ServerCrash className="w-16 h-16 text-destructive mb-4" /><h3 className="text-lg font-semibold mb-2">{title}</h3><p className="text-muted-foreground mb-4">{description}</p></div>;
}
export function SafeGroupsTab() {
  try {
    return <div className="rounded-xl border border-border/70 bg-muted/20 p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="font-semibold text-foreground">Roles are managed by Outborn Account</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Admin, Member, custom organization roles, membership assignment, and organization permissions use the Account authority. Hrive no longer creates a competing role model here.</p><Button asChild className="mt-4" size="sm"><a href="/api/outborn/account-admin?section=roles">Open Roles & Permissions <ExternalLink className="ml-2 h-4 w-4" /></a></Button></div></div></div>;
  } catch (error) {
    console.error("Failed to load Account role authority:", error);
    return <UserTabErrorState title="Error Loading Roles" description="Failed to open Outborn Account role authority" />;
  }
}
