"use client";

import type { ComponentType } from "react";
import { ImageUp, Palette, Settings2, Sidebar as SidebarIcon, Target } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { getUnderlineNavTriggerClassName } from "@/components/ui/underline-nav";

export type SystemPreferencesTabId = "general" | "appearance" | "branding" | "sidebar" | "evaluate";

interface SystemPreferencesNavigationItem {
  id: SystemPreferencesTabId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const SYSTEM_PREFERENCES_NAV_ITEMS: SystemPreferencesNavigationItem[] = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "branding", label: "Branding & Theme", icon: ImageUp },
  { id: "sidebar", label: "Sidebar", icon: SidebarIcon },
  { id: "evaluate", label: "Evaluate", icon: Target },
];

interface SystemPreferencesNavigationProps {
  activeTab: SystemPreferencesTabId;
  onTabChange: (tabId: SystemPreferencesTabId) => void;
}

export function SystemPreferencesNavigation({
  activeTab,
  onTabChange,
}: SystemPreferencesNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tabId: SystemPreferencesTabId) => {
    onTabChange(tabId);
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === "general") params.delete("tab");
    else params.set("tab", tabId);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <nav
      aria-label="System preference categories"
      className="flex w-full overflow-x-auto border-b border-border/50 mb-6"
      data-autosave-ignore
    >
      {SYSTEM_PREFERENCES_NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            aria-current={activeTab === item.id ? "page" : undefined}
            onClick={() => handleTabChange(item.id)}
            className={cn(
              getUnderlineNavTriggerClassName(activeTab === item.id),
              "px-6 py-3",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
