"use client";

import { ArrowRight, Loader2 } from "lucide-react";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type {
  DashboardStatCardItem,
  DashboardStatCardVariant,
} from "./DashboardStatCard";
import {
  formatStatValue,
  getStatValueSuffix,
} from "./DashboardStatCardUtils";

interface DashboardStatHeaderProps {
  isFeatured: boolean;
  stat: DashboardStatCardItem;
}

export function DashboardStatHeader({
  isFeatured,
  stat,
}: DashboardStatHeaderProps) {
  const Icon = stat.icon;

  return (
    <CardHeader
      className={cn(
        "relative flex flex-row items-center justify-between space-y-0",
        isFeatured ? "pb-2 sm:pb-3" : "pb-3",
      )}
    >
      <div className={cn(isFeatured ? "space-y-0.5 sm:space-y-1" : "space-y-1")}>
        <CardTitle
          className={cn(
            "font-semibold text-muted-foreground transition-colors group-hover:text-foreground",
            isFeatured ? "text-xs sm:text-sm" : "text-sm",
          )}
        >
          {stat.title}
        </CardTitle>
        <p className={cn("text-muted-foreground/70", isFeatured ? "text-[10px] sm:text-xs" : "text-xs")}>
          {stat.description}
        </p>
      </div>
      <div
        className={cn(
          "rounded-xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
          stat.bgColor,
          isFeatured ? "p-2 sm:p-3" : "p-3",
        )}
      >
        <Icon
          className={cn(
            stat.color,
            "group-hover:drop-shadow-sm",
            isFeatured ? "h-4 w-4 sm:h-6 sm:w-6" : "h-6 w-6",
          )}
        />
      </div>
    </CardHeader>
  );
}

interface DashboardStatContentProps {
  isFeatured: boolean;
  isLoading: boolean;
  isPersonal: boolean;
  showAction: boolean;
  stat: DashboardStatCardItem;
  variant: DashboardStatCardVariant;
}

export function DashboardStatContent({
  isFeatured,
  isLoading,
  isPersonal,
  showAction,
  stat,
  variant,
}: DashboardStatContentProps) {
  return (
    <CardContent className="relative">
      <div className={cn("flex items-baseline justify-between", isFeatured ? "space-x-1 sm:space-x-2" : "space-x-2")}>
        <div className={cn("flex items-baseline", isFeatured ? "space-x-1 sm:space-x-2" : "space-x-2")}>
          <DashboardStatValue
            isFeatured={isFeatured}
            isLoading={isLoading}
            isPersonal={isPersonal}
            stat={stat}
          />
          {!isLoading && (
            <div className={cn("text-muted-foreground", isFeatured ? "text-[10px] sm:text-xs" : "text-xs")}>
              {getStatValueSuffix(stat.title, stat.value, variant)}
            </div>
          )}
        </div>
        {showAction && stat.button && (
          <DashboardStatActionButton
            button={stat.button}
            isFeatured={isFeatured}
          />
        )}
      </div>
    </CardContent>
  );
}

function DashboardStatValue({
  isFeatured,
  isLoading,
  isPersonal,
  stat,
}: {
  isFeatured: boolean;
  isLoading: boolean;
  isPersonal: boolean;
  stat: DashboardStatCardItem;
}) {
  return (
    <div
      className={cn(
        "font-bold text-foreground transition-colors",
        isFeatured ? "text-2xl sm:text-3xl" : "text-3xl",
        isPersonal ? "group-hover:text-gray-900" : "group-hover:text-foreground",
      )}
    >
      {isLoading ? (
        <div className={cn("flex items-center", isFeatured ? "space-x-1 sm:space-x-2" : "space-x-2")}>
          <Loader2 className={cn("animate-spin text-primary", isFeatured ? "h-4 w-4 sm:h-6 sm:w-6" : "h-6 w-6")} />
          <span className={cn(isFeatured ? "text-sm sm:text-lg" : "text-lg")}>...</span>
        </div>
      ) : (
        formatStatValue(stat.title, stat.value)
      )}
    </div>
  );
}

function DashboardStatActionButton({
  button,
  isFeatured,
}: {
  button: NonNullable<DashboardStatCardItem["button"]>;
  isFeatured: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "group flex items-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-gray-300 hover:bg-muted/40 hover:text-foreground focus:outline-none",
        isFeatured
          ? "space-x-0.5 px-1.5 py-1 text-[10px] sm:space-x-1 sm:px-2 sm:py-1.5 sm:text-xs"
          : "space-x-1 px-2 py-1.5 text-xs",
      )}
      onClick={button.onClick}
    >
      {isFeatured ? (
        <>
          <span className="hidden sm:inline">{button.label}</span>
          <span className="sm:hidden">View</span>
        </>
      ) : (
        <span>{button.label}</span>
      )}
      <ArrowRight
        className={cn(
          "transition-transform group-hover:translate-x-0.5",
          isFeatured ? "h-2.5 w-2.5 sm:h-3 sm:w-3" : "h-3 w-3",
        )}
      />
    </button>
  );
}
