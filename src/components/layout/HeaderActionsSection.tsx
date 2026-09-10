"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { ArrowLeftOnRectangleIcon as LogIn } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import { NotificationIcon } from "@/components/ui/notification-icon";
import { HrHelpWidget } from "@/components/privacy-support/HrHelpWidget";
import { useLocalization } from '@/contexts/LocalizationContext';

import { HeaderExpandableSearch } from "./HeaderExpandableSearch";
import { HeaderDesktopUserMenu } from "./HeaderDesktopUserMenu";
import { HeaderMobileUserDrawer } from "./HeaderMobileUserDrawer";
import { HeaderOutbornApplicationLauncher } from "./HeaderOutbornApplicationLauncher";
import type { HeaderUserMenuSharedProps } from "./HeaderTypes";

interface HeaderActionsSectionProps {
  headerSearchLabel: string;
  isLoading: boolean;
  isMobile: boolean;
  pathname?: string | null;
  supportsHeaderSearch: boolean;
  userMenuProps: HeaderUserMenuSharedProps | null;
}

export function HeaderActionsSection({
  headerSearchLabel,
  isLoading,
  isMobile,
  pathname,
  supportsHeaderSearch,
  userMenuProps,
}: HeaderActionsSectionProps) {
  const [searchExpanded, setSearchExpanded] = React.useState(false);
  const { t } = useLocalization();
  const signInLabel = t("header.signIn", "Sign In");

  return (
    <div className="relative flex shrink-0 items-center gap-2">
      {supportsHeaderSearch && (
        <HeaderExpandableSearch
          expanded={searchExpanded}
          onExpandedChange={setSearchExpanded}
          placeholder={headerSearchLabel}
        />
      )}
      {isLoading ? (
        <>
          <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
        </>
      ) : (!isMobile || !searchExpanded) ? (
        <HeaderLoadedActions
          isMobile={isMobile}
          pathname={pathname}
          userMenuProps={userMenuProps}
          signInLabel={signInLabel}
        />
      ) : null}
    </div>
  );
}

function HeaderLoadedActions({
  isMobile,
  pathname,
  userMenuProps,
  signInLabel,
}: Pick<
  HeaderActionsSectionProps,
  "isMobile" | "pathname" | "userMenuProps"
> & {
  signInLabel: string;
}) {
  if (!userMenuProps) {
    return (
      <Button className="h-10" variant="outline" onClick={() => signIn()}>
        <LogIn className="mr-2 h-4 w-4" />
        {signInLabel}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="[&_button]:!h-10 [&_button]:!rounded-lg [&_button]:!text-muted-foreground [&_button]:hover:!bg-accent [&_button]:hover:!text-accent-foreground">
        <HrHelpWidget />
      </div>
      <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-border" />
      <HeaderOutbornApplicationLauncher />
      <div className="ml-0.5 [&_button]:!h-10 [&_button]:!w-10 [&_button]:!rounded-lg">
        <NotificationIcon />
      </div>
      <div className="ml-0.5">
        {isMobile ? (
          <HeaderMobileUserDrawer {...userMenuProps} />
        ) : (
          <HeaderDesktopUserMenu {...userMenuProps} />
        )}
      </div>
    </div>
  );
}
