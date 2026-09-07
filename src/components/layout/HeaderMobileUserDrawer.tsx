"use client";

import { ChevronDownIcon as ChevronDown } from "@heroicons/react/24/outline";

import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { UserAvatarCompact } from "@/components/ui/user-avatar";
import {
  HeaderMobileUserDrawerAppearance,
  HeaderMobileUserDrawerSessionActions,
} from "./HeaderMobileUserDrawerActions";
import { HeaderMobileUserDrawerAdminPreview } from "./HeaderMobileUserDrawerAdminPreview";
import { HeaderMobileUserDrawerProfile } from "./HeaderMobileUserDrawerProfile";
import type { HeaderMobileUserDrawerProps } from "./HeaderMobileUserDrawerTypes";

export function HeaderMobileUserDrawer({
  user,
  refreshAvatar,
  currentTheme,
  themePreference,
  currentLocale,
  isAdminPreviewEnabled,
  previewUsers,
  isSearchingUsers,
  onOpenProfile,
  onOpenSecurity,
  onClearCache,
  onThemeChange,
  onLocaleChange,
  onSignOut,
  onUserSearch,
  onStartImpersonation,
  labels,
}: HeaderMobileUserDrawerProps) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className="group flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full p-1.5 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={labels.openUserMenu}
        >
          <UserAvatarCompact
            user={user}
            size="sm"
            className="rounded-full ring-1 ring-border/50"
            forceRefresh={refreshAvatar}
          />
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-200 group-hover:text-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md overflow-y-auto px-4 pb-8 pt-4 custom-scrollbar">
          <div className="mt-4 space-y-6">
            <HeaderMobileUserDrawerProfile
              user={user}
              refreshAvatar={refreshAvatar}
              onOpenProfile={onOpenProfile}
              onOpenSecurity={onOpenSecurity}
              labels={labels}
            />

            {isAdminPreviewEnabled && (
              <HeaderMobileUserDrawerAdminPreview
                previewUsers={previewUsers}
                isSearchingUsers={isSearchingUsers}
                onUserSearch={onUserSearch}
                onStartImpersonation={onStartImpersonation}
                labels={labels}
              />
            )}

            <HeaderMobileUserDrawerAppearance
              currentTheme={currentTheme}
              themePreference={themePreference}
              currentLocale={currentLocale}
              onThemeChange={onThemeChange}
              onLocaleChange={onLocaleChange}
              labels={labels}
            />
            <HeaderMobileUserDrawerSessionActions
              onClearCache={onClearCache}
              onSignOut={onSignOut}
              labels={labels}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
