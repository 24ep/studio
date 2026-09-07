"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { isSidebarItemActive } from "./safe-sidebar-nav-utils";
import {
  useCurrentHeaderHref,
  useHeaderNavigationCategories,
} from "./use-header-navigation-categories";

interface ScrollState {
  hasOverflow: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

const EMPTY_SCROLL_STATE: ScrollState = {
  hasOverflow: false,
  canScrollLeft: false,
  canScrollRight: false,
};

export function HeaderSecondaryNavigation({ pathname }: { pathname: string }) {
  const currentHrefState = useCurrentHeaderHref(pathname);
  const categories = useHeaderNavigationCategories();
  const activeCategory = categories.find(category =>
    category.items.some(item => isSidebarItemActive(currentHrefState, item)),
  ) ?? categories[0];
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = React.useState<ScrollState>(EMPTY_SCROLL_STATE);

  const updateScrollState = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const hasOverflow = container.scrollWidth > container.clientWidth + 2;
    const nextState = {
      hasOverflow,
      canScrollLeft: hasOverflow && container.scrollLeft > 2,
      canScrollRight: hasOverflow && container.scrollLeft < maxScrollLeft - 2,
    };

    setScrollState(current => (
      current.hasOverflow === nextState.hasOverflow
      && current.canScrollLeft === nextState.canScrollLeft
      && current.canScrollRight === nextState.canScrollRight
        ? current
        : nextState
    ));
  }, []);

  const scrollMenu = React.useCallback((direction: -1 | 1) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollBy({
      left: direction * Math.max(180, container.clientWidth * 0.65),
      behavior: "smooth",
    });
  }, []);

  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollLeft = 0;
    setScrollState(EMPTY_SCROLL_STATE);

    const frame = requestAnimationFrame(updateScrollState);
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);
    Array.from(container.children).forEach(child => resizeObserver.observe(child));

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [activeCategory?.label, updateScrollState]);

  if (!activeCategory || activeCategory.label === "Home" || activeCategory.items.length <= 1) {
    return null;
  }

  return (
    <div className="relative z-40 shrink-0 border-b border-border/70 bg-transparent px-4 text-foreground sm:px-6 lg:px-8">
      <div className="flex h-10 min-w-0 items-stretch">
        <div
          ref={scrollContainerRef}
          onScroll={updateScrollState}
          className="flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <nav aria-label={`${activeCategory.label} navigation`} className="flex shrink-0 items-stretch">
            {activeCategory.groups.map(group => (
              <div
                key={`${activeCategory.label}-${group.id}`}
                className="flex shrink-0 items-stretch"
              >
                {group.items.map(item => {
                  const active = isSidebarItemActive(currentHrefState, item);
                  return (
                    <Link
                      key={`${activeCategory.label}-${group.id}-${item.href}`}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex shrink-0 items-center px-3 text-[13px] font-normal tracking-[-0.01em] text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        active && "font-semibold text-primary after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
        {scrollState.hasOverflow ? (
          <div className="order-last ml-auto flex shrink-0 items-stretch bg-background/90 backdrop-blur-sm">
            <button
              type="button"
              aria-label={`Show previous ${activeCategory.label} navigation items`}
              disabled={!scrollState.canScrollLeft}
              onClick={() => scrollMenu(-1)}
              className="grid w-9 place-items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-default disabled:opacity-35"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Show next ${activeCategory.label} navigation items`}
              disabled={!scrollState.canScrollRight}
              onClick={() => scrollMenu(1)}
              className="grid w-9 place-items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-default disabled:opacity-35"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
