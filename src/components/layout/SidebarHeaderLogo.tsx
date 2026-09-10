"use client";

import Image from "next/image";
import { CubeIcon as Package2 } from "@heroicons/react/24/outline";

import type { SidebarHeaderContentProps } from "./sidebar-header-content-types";
import { getEffectiveSidebarLogoSize, selectSidebarLogoUrl } from "./sidebar-header-content-utils";

interface SidebarHeaderLogoProps {
  isCollapsed: boolean;
  isDarkMode: boolean;
  isClient: boolean;
  isLogoLoading: boolean;
  appLogoUrl: string | null;
  sidebarLogoSize: number;
  collapsedSidebarLogoSize: number;
  contextualLogos: NonNullable<SidebarHeaderContentProps["contextualLogos"]>;
}

export function SidebarHeaderLogo({
  isCollapsed,
  isDarkMode,
  isClient,
  isLogoLoading,
  appLogoUrl,
  sidebarLogoSize,
  collapsedSidebarLogoSize,
  contextualLogos,
}: SidebarHeaderLogoProps) {
  if (isLogoLoading) {
    return <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />;
  }

  const logoToUse = selectSidebarLogoUrl({
    appLogoUrl,
    contextualLogos,
    isCollapsed,
    isDarkMode,
  });

  if (!isClient || !logoToUse) {
    return <Package2 className="h-6 w-6" />;
  }

  const effectiveLogoSize = getEffectiveSidebarLogoSize({
    isCollapsed,
    sidebarLogoSize,
    collapsedSidebarLogoSize,
  });

  return (
    <div className="relative">
      <Image
        src={logoToUse}
        alt="App Logo"
        width={effectiveLogoSize}
        height={effectiveLogoSize}
        unoptimized
        sizes={`${effectiveLogoSize}px`}
        style={{
          maxWidth: `${effectiveLogoSize}px`,
          maxHeight: `${effectiveLogoSize}px`,
          width: "auto",
          height: "auto",
        }}
        className="object-contain"
        data-ai-hint="company logo"
      />
      <Package2 className="h-6 w-6 absolute inset-0 m-auto opacity-0" style={{ pointerEvents: "none" }} />
    </div>
  );
}
