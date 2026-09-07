"use client";

import Image from "next/image";

import { convertMinIOUrlToSecureUrl } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";

const DEFAULT_COMPANY_LOGO_URL = "/brand/default-company-building.svg";

interface HeaderBrandLockupProps {
  appLogoUrl: string | null;
  currentAppName: string;
  compact?: boolean;
}

export function HeaderBrandLockup({
  appLogoUrl,
  currentAppName,
  compact = false,
}: HeaderBrandLockupProps) {
  const configuredCompanyLogoUrl = convertMinIOUrlToSecureUrl(appLogoUrl, false);
  const companyLogoUrl = configuredCompanyLogoUrl || DEFAULT_COMPANY_LOGO_URL;
  const isDefaultCompanyLogo = companyLogoUrl === DEFAULT_COMPANY_LOGO_URL;

  return (
    <span className={cn("flex min-w-0 items-center", compact ? "gap-2" : "gap-2.5")}>
      <span
        className={cn(
          "relative grid shrink-0 place-items-center overflow-hidden",
          compact ? "h-7 w-7" : "h-8 w-8",
          isDefaultCompanyLogo && "rounded-md bg-transparent",
        )}
      >
        <Image
          src={companyLogoUrl}
          alt={`${currentAppName} company logo`}
          fill
          unoptimized
          sizes={compact ? "28px" : "32px"}
          className={cn(
            "object-contain",
            isDefaultCompanyLogo
              ? "p-0.5 dark:brightness-0 dark:invert"
              : "dark:drop-shadow-[0_0_1px_rgba(255,255,255,0.7)]",
          )}
        />
      </span>

      <span aria-hidden="true" className="h-6 w-px shrink-0 bg-border" />

      <span
        aria-label="Obsi People"
        className={cn(
          "flex shrink-0 items-baseline font-semibold tracking-[-0.025em]",
          compact ? "text-[15px]" : "text-[17px]",
        )}
      >
        <span className="text-foreground">Obsi</span>
        <span className="ml-1.5 text-muted-foreground">People</span>
      </span>
    </span>
  );
}
