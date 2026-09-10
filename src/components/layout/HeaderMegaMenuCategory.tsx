"use client";

import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  formatProcessQueueBadgeCount,
  isSidebarItemActive,
  shouldShowProcessQueueBadge,
} from "./safe-sidebar-nav-utils";
import {
  getCategoryFirstHref,
  type HeaderNavigationCategory,
} from "./header-navigation-config";

interface HeaderMegaMenuCategoryProps {
  category: HeaderNavigationCategory;
  currentHrefState: string;
  isOpen: boolean;
  pendingCount: number | null;
  onMenuMouseEnter: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onNavigate: (href: string) => void;
  onOpenChange: (open: boolean) => void;
}

export function HeaderMegaMenuCategory({
  category,
  currentHrefState,
  isOpen,
  pendingCount,
  onMenuMouseEnter,
  onMouseEnter,
  onMouseLeave,
  onNavigate,
  onOpenChange,
}: HeaderMegaMenuCategoryProps) {
  const isActive = category.items.some(item =>
    isSidebarItemActive(currentHrefState, item),
  );
  const firstItemHref = getCategoryFirstHref(category);
  const columnCount = Math.min(category.groups.length, 3);
  const CategoryIcon = category.groups[0]?.icon;

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-current={isActive ? "page" : undefined}
          onClick={(event) => {
            if (!firstItemHref) return;
            event.preventDefault();
            onNavigate(firstItemHref);
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={cn(
            "relative flex items-center gap-1.5 px-2 text-sm font-normal leading-6 tracking-[-0.01em] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring xl:px-3",
            isActive && "font-medium text-primary after:absolute after:inset-x-2.5 after:bottom-0 after:h-[3px] after:bg-primary",
          )}
        >
          {CategoryIcon ? (
            <CategoryIcon className="h-4 w-4 shrink-0 stroke-[1.7]" />
          ) : null}
          {category.label}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={0}
        onMouseEnter={onMenuMouseEnter}
        onMouseLeave={onMouseLeave}
        className="z-[120] max-h-[72vh] w-[min(92vw,780px)] overflow-y-auto rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl data-[state=closed]:animate-none data-[state=closed]:opacity-0 motion-reduce:animate-none"
      >
        <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
          <div>
            <p className="text-sm font-semibold">{category.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {category.description}
            </p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {category.items.length} link{category.items.length === 1 ? "" : "s"}
          </span>
        </div>

        <div
          className="grid items-start gap-5"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {category.groups.map(group => {
            const GroupIcon = group.icon;

            return (
              <section key={group.id} className="min-w-0">
                <div className="mb-2 flex items-center gap-2 px-2">
                  <GroupIcon className="h-4 w-4 shrink-0 stroke-[1.7] text-primary" />
                  <h2 className="truncate text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {group.label}
                  </h2>
                </div>

                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const ItemIcon = item.icon;
                    const active = isSidebarItemActive(currentHrefState, item);
                    const badge = shouldShowProcessQueueBadge(item, pendingCount)
                      ? formatProcessQueueBadgeCount(pendingCount)
                      : null;

                    return (
                      <DropdownMenuItem key={`${group.id}-${item.href}`} asChild>
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group flex min-h-11 cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 text-sm font-normal text-foreground outline-none transition-colors focus:bg-accent focus:text-accent-foreground",
                            active && "bg-primary/10 font-medium text-primary",
                          )}
                        >
                          <ItemIcon className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.7]" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate leading-5">{item.label}</span>
                            {item.description ? (
                              <span className="mt-0.5 block line-clamp-2 text-xs font-normal leading-4 text-muted-foreground/75 group-focus:text-muted-foreground">
                                {item.description}
                              </span>
                            ) : null}
                          </span>
                          {badge ? (
                            <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-destructive">
                              {badge}
                            </span>
                          ) : null}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
