"use client";

import { ChevronLeftIcon as ChevronLeft } from "@heroicons/react/24/outline";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { SidebarHeaderLogo } from "./SidebarHeaderLogo";
import { SidebarHeaderUserMenu } from "./SidebarHeaderUserMenu";
import type { SidebarHeaderContentProps } from "./sidebar-header-content-types";
import { useSidebarHeaderContent } from "./use-sidebar-header-content";
import { useLocalization } from '@/contexts/LocalizationContext';

export function SidebarHeaderContent({
  currentAppName,
  appLogoUrl,
  isClient,
  isLogoLoading,
  showLogoOnly = false,
  sidebarLogoSize = 48,
  collapsedSidebarLogoSize = 40,
  contextualLogos = {},
}: SidebarHeaderContentProps) {
  const { t } = useLocalization();
  const {
    user,
    sidebarOpen,
    isDarkMode,
    isToggling,
    handleToggle,
    handleSettingsSelect,
    handleLogoutSelect,
  } = useSidebarHeaderContent();

  const logo = (isCollapsed: boolean) => (
    <SidebarHeaderLogo
      isCollapsed={isCollapsed}
      isDarkMode={isDarkMode}
      isClient={isClient}
      isLogoLoading={isLogoLoading}
      appLogoUrl={appLogoUrl}
      sidebarLogoSize={sidebarLogoSize}
      collapsedSidebarLogoSize={collapsedSidebarLogoSize}
      contextualLogos={contextualLogos}
    />
  );

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-4 gap-4 bg-sidebar/40 backdrop-blur-xl border-b border-border/50">
        {user && (
          <SidebarHeaderUserMenu
            user={user}
            collapsed
            onSettingsSelect={handleSettingsSelect}
            onLogoutSelect={handleLogoutSelect}
          />
        )}
      <div className="h-1px w-8 bg-border/30" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-full">{logo(true)}</div>
            </TooltipTrigger>
            <TooltipContent side="right">{showLogoOnly ? t("app.application", "Application") : currentAppName}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full border-b border-border/50 bg-sidebar/30 backdrop-blur-xl">
      {user && (
        <div className="p-4 border-b border-border/30">
          <SidebarHeaderUserMenu
            user={user}
            collapsed={false}
            onSettingsSelect={handleSettingsSelect}
            onLogoutSelect={handleLogoutSelect}
          />
        </div>
      )}

      <div className="flex items-center h-[64px] w-full px-4">
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">{logo(false)}</div>
          {!showLogoOnly && (
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="font-bold text-base truncate text-foreground/90 tracking-tight">{currentAppName}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggle}
                disabled={isToggling}
                aria-label={t("layout.collapseSidebar", "Collapse sidebar")}
                className="rounded-xl hover:bg-sidebar-accent shadow-none h-8 w-8 text-muted-foreground hover:text-foreground transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
