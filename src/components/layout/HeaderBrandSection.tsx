"use client";

import Link from "next/link";
import { ChevronLeftIcon as ChevronLeft } from "@heroicons/react/24/outline";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAppLayoutBreadcrumbItems } from "./app-layout-view-utils";
import { HeaderBrandLockup } from "./HeaderBrandLockup";
import { useLocalization } from '@/contexts/LocalizationContext';

interface HeaderBrandSectionProps {
  currentAppName: string;
  appLogoUrl: string | null;
  showLogoOnly: boolean;
  isMobile: boolean;
  pageTitle: string;
  pathname?: string | null;
  onLogoClick: () => void;
  onMobileBack: () => void;
}

export function HeaderBrandSection({
  currentAppName,
  appLogoUrl,
  showLogoOnly,
  isMobile,
  pageTitle,
  pathname,
  onLogoClick,
  onMobileBack,
}: HeaderBrandSectionProps) {
  const { t } = useLocalization();
  const breadcrumbItems = getAppLayoutBreadcrumbItems(pathname ?? null, (key, fallback) => t(key, fallback));

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
      <button
        type="button"
        onClick={onLogoClick}
        className="flex min-w-0 items-center group text-left transition-transform duration-200 active:scale-95 lg:hidden"
      >
        <HeaderBrandLockup
          appLogoUrl={appLogoUrl}
          currentAppName={currentAppName}
          compact
        />
        <div className="hidden lg:flex items-center gap-3 overflow-hidden whitespace-nowrap">
          {!showLogoOnly && (
            <div className="flex flex-col justify-center overflow-hidden">
              <h1 className="truncate text-[13px] font-semibold leading-tight tracking-normal text-slate-950 dark:text-white" style={{ color: "var(--header-foreground, inherit)" }}>
                {currentAppName}
              </h1>
              <p className="mt-0.5 text-[10px] font-medium leading-none text-slate-500 dark:text-zinc-400">
                {t("brand.workspace", "HRIS workspace")}
              </p>
            </div>
          )}
        </div>
      </button>

      {isMobile && pathname?.includes("/evaluate") && (
        <Button
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
          onClick={onMobileBack}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}

      {!isMobile && (
        <nav aria-label={t("navigation.breadcrumb", "Breadcrumb")} className="hidden min-w-0 items-center gap-2 md:flex">
          <Link
            href="/"
            className="truncate rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {currentAppName || t("labels.portal", "Portal")}
          </Link>
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;

            return (
              <span key={item.href} className="flex min-w-0 items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                {isLast ? (
                  <span
                    aria-current="page"
                    className="truncate text-sm font-semibold text-foreground"
                  >
                    {item.label || pageTitle}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="truncate rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {item.label || pageTitle}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>
      )}
    </div>
  );
}
