"use client";

import { ArrowRightOnRectangleIcon as LogOut, Cog6ToothIcon as Settings } from "@heroicons/react/24/outline";

import { UserAvatarCompact } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocalization } from '@/contexts/LocalizationContext';

import type { SidebarHeaderUser } from "./sidebar-header-content-types";

interface SidebarHeaderUserMenuProps {
  user: SidebarHeaderUser;
  collapsed: boolean;
  onSettingsSelect: () => void;
  onLogoutSelect: () => void;
}

export function SidebarHeaderUserMenu({
  user,
  collapsed,
  onSettingsSelect,
  onLogoutSelect,
}: SidebarHeaderUserMenuProps) {
  const { t } = useLocalization();

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-10 w-10 rounded-xl overflow-hidden ring-2 ring-primary/20 hover:ring-indigo-500/50 hover:scale-105 transition-all shadow-lg shadow-primary/10 active:scale-95 group"
            aria-label={t("header.openUserMenu", "Open user menu")}
        >
          <UserAvatarCompact user={user} size="sm" />
            <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/10 transition-colors" />
          </button>
        </DropdownMenuTrigger>
        <SidebarHeaderUserMenuContent
          user={user}
          collapsed
          onSettingsSelect={onSettingsSelect}
          onLogoutSelect={onLogoutSelect}
        />
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-indigo-500/5 transition-all cursor-pointer group border border-transparent hover:border-indigo-500/20 shadow-sm hover:shadow-indigo-500/10">
          <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden ring-2 ring-primary/10 group-hover:ring-indigo-500/40 transition-all shadow-sm group-hover:shadow-md">
            <UserAvatarCompact user={user} size="md" />
            <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors" />
          </div>
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-sm font-bold text-foreground/90 truncate group-hover:text-indigo-600 transition-colors tracking-tight">
              {user.name}
            </span>
            <span className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-[0.15em] group-hover:text-indigo-500/70 transition-colors">
              {user.role}
            </span>
          </div>
        </div>
      </DropdownMenuTrigger>
      <SidebarHeaderUserMenuContent
        user={user}
        collapsed={false}
        onSettingsSelect={onSettingsSelect}
        onLogoutSelect={onLogoutSelect}
      />
    </DropdownMenu>
  );
}

function SidebarHeaderUserMenuContent({
  user,
  collapsed,
  onSettingsSelect,
  onLogoutSelect,
}: SidebarHeaderUserMenuProps) {
  const { t } = useLocalization();
  return (
    <DropdownMenuContent
      align="start"
      side={collapsed ? "right" : undefined}
      className={`w-64 rounded-2xl border border-border/50 shadow-2xl overflow-hidden ${collapsed ? "ml-3" : "mt-2"}`}
    >
      <DropdownMenuLabel className="font-normal p-0">
        <div className="bg-gradient-to-br from-indigo-500/10 to-blue-600/10 px-5 py-4 border-b border-border/30">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest opacity-80">
            {collapsed ? t("account.user", "User Account") : t("account.loggedInAs", "Logged in as")}
          </p>
          <p className="text-sm font-bold text-foreground truncate mt-0.5">
            {collapsed ? user.name : user.email || user.name}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onSettingsSelect}>
        <Settings className="mr-2 h-4 w-4" />
        {t("header.settings", "Settings")}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive" onSelect={onLogoutSelect}>
        <LogOut className="mr-2 h-4 w-4" />
        {t("header.logout", "Logout")}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
