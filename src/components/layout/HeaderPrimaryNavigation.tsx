"use client";

import { useRouter } from "next/navigation";

import { HeaderMegaMenuCategory } from "./HeaderMegaMenuCategory";
import {
  useCurrentHeaderHref,
  useHeaderNavigationCategories,
} from "./use-header-navigation-categories";
import { useHeaderCategoryMenu } from "./use-header-category-menu";
import { usePendingCount } from "./use-pending-count";

export { HeaderSecondaryNavigation } from "./HeaderSecondaryNavigation";

export function HeaderPrimaryNavigation({ pathname }: { pathname: string }) {
  const currentHrefState = useCurrentHeaderHref(pathname);
  const categories = useHeaderNavigationCategories();
  const { pendingCount } = usePendingCount();
  const router = useRouter();
  const categoryMenu = useHeaderCategoryMenu(currentHrefState);

  return (
    <nav
      aria-label="Primary navigation"
      className="hidden h-16 min-w-0 items-stretch lg:flex"
    >
      {categories.map(category => (
        <HeaderMegaMenuCategory
          key={category.label}
          category={category}
          currentHrefState={currentHrefState}
          isOpen={categoryMenu.openCategory === category.label}
          pendingCount={pendingCount}
          onMenuMouseEnter={categoryMenu.clearCloseTimer}
          onMouseEnter={() => categoryMenu.scheduleOpen(category.label)}
          onMouseLeave={() => categoryMenu.scheduleClose(category.label)}
          onOpenChange={open => categoryMenu.setCategoryOpen(category.label, open)}
          onNavigate={href => {
            categoryMenu.closeCategory();
            void router.push(href);
          }}
        />
      ))}
    </nav>
  );
}
