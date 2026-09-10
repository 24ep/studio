import type { ComponentType } from "react";
import { Eye, FileText, List, Shield, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import { getUnderlineNavTriggerClassName } from "@/components/ui/underline-nav";

export type CustomFieldDrawerTab = "basic" | "permissions" | "visibility" | "options" | "advanced";

interface CustomFieldDrawerTabsProps {
  activeTab: CustomFieldDrawerTab;
  isSelectType: boolean;
  onTabChange: (tab: CustomFieldDrawerTab) => void;
}

const CUSTOM_FIELD_TABS: Array<{
  id: CustomFieldDrawerTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
  selectOnly?: boolean;
}> = [
  { id: "basic", label: "Basic Info", icon: FileText },
  { id: "permissions", label: "Permissions", icon: Shield },
  { id: "visibility", label: "Visibility", icon: Eye },
  { id: "options", label: "Options", icon: List, selectOnly: true },
  { id: "advanced", label: "Advanced", icon: Zap },
];

export function CustomFieldDrawerTabs({
  activeTab,
  isSelectType,
  onTabChange,
}: CustomFieldDrawerTabsProps) {
  return (
    <div className="flex w-full border-b border-border/50 mb-6 flex-shrink-0">
      {CUSTOM_FIELD_TABS
        .filter(tab => !tab.selectOnly || isSelectType)
        .map((tab) => {
          const Icon = tab.icon;

          return (
            <div
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                getUnderlineNavTriggerClassName(activeTab === tab.id),
                "px-6 py-3",
              )}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.currentTarget.click();
                }
              }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </div>
          );
        })}
    </div>
  );
}
