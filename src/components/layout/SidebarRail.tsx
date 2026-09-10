"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowRightOnRectangleIcon,
  BellIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  FolderIcon,
  IdentificationIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDrawer } from "@/components/ui/notification-drawer";
import { UserAvatarCompact } from "@/components/ui/user-avatar";
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import type { AppLayoutContextualLogos } from "./app-layout-settings";
import type { SidebarNavGroup } from "./SidebarNavConfig";
import { SidebarHeaderLogo } from "./SidebarHeaderLogo";
import { useLocalization } from '@/contexts/LocalizationContext';

interface SidebarRailProps {
  appLogoUrl: string | null;
  contextualLogos: Partial<AppLayoutContextualLogos>;
  currentAppName: string;
  filteredGroups: SidebarNavGroup[];
  activeGroupLabel: string | undefined;
  hoveredGroupLabel: string | undefined;
  isPinned: boolean;
  isLogoLoading: boolean;
  onPinnedChange: (pinned: boolean) => void;
  onHubClick: (label: string) => void;
  onHubHover: (label: string | undefined) => void;
}

export const SidebarRail = React.memo(function SidebarRail({
  appLogoUrl,
  contextualLogos,
  currentAppName,
  filteredGroups,
  activeGroupLabel,
  hoveredGroupLabel,
  isLogoLoading,
  onHubClick,
  onHubHover,
}: SidebarRailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();
  const { currentTheme, mounted } = useTheme();
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = React.useState(false);
  const { t } = useLocalization();
  const availableGroupLabels = React.useMemo(
    () => new Set(filteredGroups.map((group) => group.label)),
    [filteredGroups],
  );
  const primaryGroups = React.useMemo(
    () => filteredGroups,
    [filteredGroups],
  );
  const activeModule = activeGroupLabel;
  const hoverModule = hoveredGroupLabel;
  const user = session?.user
    ? {
      id: session.user.id,
      name: session.user.name || session.user.email || t("header.userFallback", "User"),
      email: session.user.email || undefined,
      role: session.user.role || t("header.recruiterFallback", "Recruiter"),
      avatarUrl: session.user.avatarUrl || null,
      image: session.user.image || null,
      personalColor: session.user.personalColor || null,
    }
    : null;
  const formattedUnreadCount = unreadCount > 99 ? "99+" : unreadCount;

  const handleSignOut = React.useCallback(async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  }, []);

  return (
    <>
      <aside
        data-sidebar-surface="rail"
        className="hidden h-full w-[80px] flex-shrink-0 flex-col items-center border-r border-white/10 bg-[#10345f] font-sidebar text-white shadow-[16px_0_40px_rgba(15,23,42,0.16)] lg:flex"
      >
        <div className="pb-5 pt-5">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-[8px] bg-white/10 transition-colors duration-sidebar hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label={`${t("app.goTo", "Go to")} ${currentAppName || t("app.application", "application")} ${t("navigation.home", "Home")}`}
            onClick={() => router.push("/")}
          >
            <SidebarHeaderLogo
              isCollapsed
              isDarkMode={currentTheme === "dark"}
              isClient={mounted}
              isLogoLoading={isLogoLoading}
              appLogoUrl={appLogoUrl}
              sidebarLogoSize={48}
              collapsedSidebarLogoSize={40}
              contextualLogos={contextualLogos}
            />
          </button>
        </div>

        <nav className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto px-2 pb-4">
          {primaryGroups.map((group) => {
            const Icon = group.icon;
            const isActive = (hoverModule || activeModule) === group.label;
            const isAvailable = availableGroupLabels.has(group.label);

            return (
              <button
                key={group.label}
                type="button"
                className={cn(
                  "group flex w-full flex-col items-center gap-1 rounded-[8px] px-1.5 py-2 text-[10.5px] font-medium leading-tight transition-colors duration-sidebar",
                  isAvailable
                    ? "text-white/76 hover:text-white"
                    : "cursor-default text-white/45",
                  isActive && isAvailable && "bg-white text-[#10345f] shadow-[0_10px_22px_rgba(0,0,0,0.16)]",
                )}
                onClick={() => {
                  if (isAvailable) onHubClick(group.label);
                }}
                onMouseEnter={() => {
                  if (isAvailable) onHubHover(group.label);
                }}
                aria-current={isActive && isAvailable ? "page" : undefined}
                aria-disabled={!isAvailable}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full transition-colors duration-sidebar",
                    isActive && isAvailable ? "bg-[#e8f4ff]" : "bg-transparent group-hover:bg-white/12",
                  )}
                >
                  <Icon className="h-[var(--sidebar-icon-size)] w-[var(--sidebar-icon-size)]" />
                </span>
                <span className="max-w-full truncate">{group.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-4 pb-5">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative grid h-12 w-12 place-items-center rounded-full transition-transform duration-sidebar hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  aria-label={t("header.openUserMenu", "Open user menu")}
                >
                  <UserAvatarCompact user={user} size="md" className="ring-2 ring-white/70" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-lg ring-2 ring-[color-mix(in_srgb,hsl(var(--primary-gradient-end-l))_42%,black)]">
                      {formattedUnreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="right"
                sideOffset={12}
                className="w-64 rounded-xl border border-border/60 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:bg-zinc-900/95"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <span className="block truncate text-sm font-semibold text-slate-950 dark:text-white">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs font-normal text-slate-500 dark:text-zinc-400">
                    {user.email || user.role}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <RailUserMenuItem icon={UserCircleIcon} label={t("account.profile", "User profile")} onSelect={() => router.push("/ess/profile")} />
                <RailUserMenuItem icon={Cog6ToothIcon} label={t("account.preference", "Preference")} onSelect={() => router.push("/settings/preferences")} />
                <RailUserMenuItem
                  icon={BellIcon}
                  label={t("notifications.messages", "Message")}
                  badge={unreadCount > 0 ? formattedUnreadCount : undefined}
                  onSelect={() => setIsNotificationDrawerOpen(true)}
                />
                <RailUserMenuItem icon={FolderIcon} label={t("documents.documents", "Document")} onSelect={() => router.push("/ess/documents")} />
                <RailUserMenuItem icon={DocumentTextIcon} label={t("documents.payslips", "Payslips")} onSelect={() => router.push("/ess/documents?tab=payslips")} />
                <RailUserMenuItem icon={IdentificationIcon} label={t("app.essDashboard", "ESS dashboard")} onSelect={() => router.push("/ess")} />
                <DropdownMenuSeparator />
                <RailUserMenuItem icon={ArrowRightOnRectangleIcon} label={t("header.signOut", "Sign out")} danger onSelect={handleSignOut} />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </aside>

      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        onNotificationRead={() => {}}
      />
    </>
  );
});

function RailUserMenuItem({
  icon: Icon,
  label,
  badge,
  danger = false,
  onSelect,
}: {
  icon: React.ElementType<{ className?: string }>;
  label: string;
  badge?: string | number;
  danger?: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer items-center rounded-lg px-3 py-2 text-sm font-medium",
        danger
          ? "text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
          : "text-slate-700 focus:text-slate-950 dark:text-zinc-300 dark:focus:text-white",
      )}
    >
      <Icon className="mr-3 h-4 w-4" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      )}
    </DropdownMenuItem>
  );
}
