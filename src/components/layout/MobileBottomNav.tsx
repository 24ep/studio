"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AcademicCapIcon as AcademicCap,
  BanknotesIcon as Banknotes,
  BriefcaseIcon as Briefcase,
  CalendarDaysIcon as CalendarDays,
  ClockIcon as Clock,
  Cog6ToothIcon as Settings,
  EllipsisHorizontalIcon as MoreHorizontal,
  IdentificationIcon as Identification,
  UsersIcon as Users,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { isSidebarItemActive } from "./safe-sidebar-nav-utils";
import { isFullPageWorkspacePath } from "@/lib/full-page-routes";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useSession } from "next-auth/react";
import { hasAnyPermission, hasPermission, type SessionLikeUser } from "@/lib/permissions";
import { useLocalization } from '@/contexts/LocalizationContext';

export type MobileNavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

export function buildMobileNavItems(
  user: SessionLikeUser,
  localize: (key: string, fallback: string) => string = (_, fallback) => fallback,
): MobileNavItem[] {
  const canViewPeople = hasAnyPermission(user, ["HR_PEOPLE_VIEW", "HR_PEOPLE_MANAGE"]);
  const canViewWorkforce = hasAnyPermission(user, ["HR_WORKFORCE_VIEW", "HR_WORKFORCE_MANAGE"]);
  const canViewPayroll = hasAnyPermission(user, ["HR_PAYROLL_VIEW", "HR_PAYROLL_MANAGE"]);
  const canViewExpenses = hasAnyPermission(user, ["EXPENSES_VIEW", "EXPENSES_APPROVE", "EXPENSES_FINANCE"]);
  const canViewHiring = hasAnyPermission(user, ["applicantS_VIEW", "POSITIONS_VIEW"]);

  const items: Array<MobileNavItem & { show: boolean }> = [
    {
      href: "/my-workday",
      label: localize("navigation.home", "Home"),
      icon: CalendarDays,
      show: true,
    },
    {
      href: "/people",
      label: localize("navigation.people", "People"),
      icon: Users,
      show: canViewPeople,
    },
    {
      href: "/ess/profile",
      label: localize("navigation.ess", "ESS"),
      icon: Identification,
      show: true,
    },
    {
      href: "/workforce/attendance?view=attendance",
      label: localize("navigation.workforce", "Workforce"),
      icon: Clock,
      show: canViewWorkforce,
    },
    {
      href: "/workforce/leave",
      label: localize("navigation.leave", "Leave"),
      icon: CalendarDays,
      show: canViewWorkforce,
    },
    {
      href: canViewPayroll ? "/payroll" : "/expenses",
      label: localize("navigation.pay", "Pay"),
      icon: Banknotes,
      show: canViewPayroll || canViewExpenses,
    },
    {
      href: "/applicants",
      label: localize("navigation.hiring", "Hiring"),
      icon: Briefcase,
      show: canViewHiring,
    },
    {
      href: "/learning",
      label: localize("navigation.growth", "Growth"),
      icon: AcademicCap,
      show: true,
    },
    {
      href: "/settings",
      label: localize("navigation.admin", "Admin"),
      icon: Settings,
      show: hasPermission(user, "SYSTEM_SETTINGS_VIEW"),
    },
  ];

  return items.filter(item => item.show).map(({ show: _show, ...item }) => item);
}

export function partitionMobileNavItems(items: MobileNavItem[], maxVisibleItems = 5) {
  if (items.length <= maxVisibleItems) {
    return { primaryItems: items, overflowItems: [] as MobileNavItem[] };
  }

  const primaryCount = Math.max(1, maxVisibleItems - 1);
  return {
    primaryItems: items.slice(0, primaryCount),
    overflowItems: items.slice(primaryCount),
  };
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isEmbeddedFrame, setIsEmbeddedFrame] = React.useState(false);
  const { t } = useLocalization();

  React.useEffect(() => {
    setIsEmbeddedFrame(
      window.self !== window.top ||
      new URLSearchParams(window.location.search).get('adminCenterEmbed') === '1',
    );
  }, []);

  if (pathname?.startsWith('/auth/') || !session?.user || isEmbeddedFrame || isFullPageWorkspacePath(pathname)) {
    return null;
  }

  const navItems = buildMobileNavItems(session.user, t);
  const { primaryItems, overflowItems } = partitionMobileNavItems(navItems);
  const overflowIsActive = overflowItems.some(item => isSidebarItemActive(pathname || "", item));

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-[100] border-t border-border/80 bg-card/95 backdrop-blur-md md:hidden no-print",
        "shadow-[0_-4px_16px_hsl(var(--foreground)/0.08)]"
      )}
      aria-label={t("navigation.primaryMobile", "Primary mobile navigation")}
    >
      <div className="flex min-h-16 items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {primaryItems.map((item) => {
          const isActive = isSidebarItemActive(pathname || "", item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs font-medium",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive && "fill-current stroke-[1.5]"
                )}
                strokeWidth={isActive ? 1.5 : 2}
              />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}

        {overflowItems.length > 0 ? (
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className={cn(
                  "relative flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-xs font-medium",
                  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
                  overflowIsActive ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
                aria-current={overflowIsActive ? "page" : undefined}
                aria-label={t("navigation.more", "More navigation")}
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                <span className="max-w-full truncate">{t("navigation.moreShort", "More")}</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="max-h-[72dvh] overflow-y-auto rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]"
            >
              <SheetHeader className="text-left">
                <SheetTitle>{t("navigation.moreDestinations", "More destinations")}</SheetTitle>
                <SheetDescription>
                  {t("navigation.moreDestinationsDescription", "Open additional Hrive areas available to your account.")}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {overflowItems.map((item) => {
                  const isActive = isSidebarItemActive(pathname || "", item);
                  const Icon = item.icon;
                  return (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex min-h-20 items-center gap-3 rounded-xl border border-border/70 px-3 py-3 text-sm font-medium",
                          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          isActive
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "bg-background text-foreground hover:bg-muted/60",
                        )}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 truncate">{item.label}</span>
                      </Link>
                    </SheetClose>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </nav>
  );
}
