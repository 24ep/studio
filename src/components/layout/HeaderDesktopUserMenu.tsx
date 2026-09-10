"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { HeaderUserMenuSharedProps } from "./HeaderTypes";
import {
  HeaderDesktopAccountActions,
  HeaderDesktopAppearanceSection,
  HeaderDesktopPreviewTools,
  HeaderDesktopSignOutSection,
  HeaderDesktopUserLabel,
  HeaderDesktopUserMenuTrigger,
} from "./HeaderDesktopUserMenuParts";

export function HeaderDesktopUserMenu(props: HeaderUserMenuSharedProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderDesktopUserMenuTrigger user={props.user} refreshAvatar={props.refreshAvatar} labels={props.labels} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl border border-border/70 bg-popover/95 p-0 text-popover-foreground shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-200">
        <HeaderDesktopUserLabel user={props.user} labels={props.labels} />
        <HeaderDesktopAccountActions
          onOpenProfile={props.onOpenProfile}
          onOpenSecurity={props.onOpenSecurity}
          labels={props.labels}
        />
        <HeaderDesktopPreviewTools
          isAdminPreviewEnabled={props.isAdminPreviewEnabled}
          previewUsers={props.previewUsers}
          isSearchingUsers={props.isSearchingUsers}
          onUserSearch={props.onUserSearch}
          onStartImpersonation={props.onStartImpersonation}
          labels={props.labels}
        />
        <HeaderDesktopAppearanceSection
          currentTheme={props.currentTheme}
          themePreference={props.themePreference}
          currentLocale={props.currentLocale}
          onThemeChange={props.onThemeChange}
          onLocaleChange={props.onLocaleChange}
          onClearCache={props.onClearCache}
          labels={props.labels}
        />
        <HeaderDesktopSignOutSection onSignOut={props.onSignOut} labels={props.labels} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
