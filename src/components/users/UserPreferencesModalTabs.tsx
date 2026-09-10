"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { UserPreferencesAppearanceTab } from "./UserPreferencesAppearanceTab";
import { UserPreferencesPositionsTab } from "./UserPreferencesPositionsTab";
import { UserPreferencesSidebarTab } from "./UserPreferencesSidebarTab";
import { UserPreferencesTaskBoardTab } from "./UserPreferencesTaskBoardTab";
import type {
  UserPreferences,
  UserPreferencesActions,
} from "./UserPreferencesModalTypes";

const TAB_TRIGGER_CLASS =
  "h-12 !rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-1 font-medium transition-all";

export function UserPreferencesTabs({
  actions,
  preferences,
}: {
  actions: UserPreferencesActions;
  preferences: UserPreferences;
}) {
  return (
    <Tabs defaultValue="appearance" className="flex-1 flex flex-col h-full">
      <div className="border-b px-6 bg-background/95 backdrop-blur-sm sticky top-0 z-10 w-full">
        <TabsList className="h-12 bg-transparent p-0 gap-6 w-full justify-start overflow-x-auto no-scrollbar">
          <TabsTrigger value="appearance" className={TAB_TRIGGER_CLASS}>
            Appearance
          </TabsTrigger>
          <TabsTrigger value="taskBoard" className={TAB_TRIGGER_CLASS}>
            Task Board
          </TabsTrigger>
          <TabsTrigger value="positions" className={TAB_TRIGGER_CLASS}>
            Positions
          </TabsTrigger>
          <TabsTrigger value="sidebar" className={TAB_TRIGGER_CLASS}>
            Sidebar
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 overflow-y-auto">
        <UserPreferencesAppearanceTab
          preferences={preferences}
          actions={actions}
        />
        <UserPreferencesTaskBoardTab
          preferences={preferences}
          actions={actions}
        />
        <UserPreferencesPositionsTab
          preferences={preferences}
          actions={actions}
        />
        <UserPreferencesSidebarTab
          preferences={preferences}
          actions={actions}
        />
      </div>
    </Tabs>
  );
}
