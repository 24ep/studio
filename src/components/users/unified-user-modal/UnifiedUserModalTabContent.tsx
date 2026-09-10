"use client";

import type { UseFormReturn } from "react-hook-form";

import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import type { CustomFieldValue, UserGroup, UserProfile } from "@/lib/types";
import type { UserPreferences } from "@/hooks/use-user-preferences";

import { HiringDetailTab } from "../HiringDetailTab";
import { PreferencesTab } from "./PreferencesTab";
import { ProfileTab } from "./ProfileTab";
import { SecurityTab } from "./SecurityTab";
import { UserManagementForm } from "./UserManagementForm";
import {
  UNIFIED_USER_ACCOUNT_TAB_CONTENT_CLASS,
  UNIFIED_USER_TAB_CONTENT_CLASS,
} from "./unified-user-modal-utils";
import type {
  ModalMode,
  UnifiedUserCustomFields,
  UnifiedUserFormValues,
  UnifiedUserPreferenceUpdates,
} from "./types";

interface UnifiedUserModalTabContentProps {
  activeTab: string;
  form: UseFormReturn<UnifiedUserFormValues>;
  mode: ModalMode;
  user?: UserProfile | null;
  customFields: UnifiedUserCustomFields;
  customFieldDefinitions: unknown[];
  onCustomFieldChange: (fieldCode: string, value: CustomFieldValue) => void;
  userGroups: UserGroup[];
  isLoadingGroups: boolean;
  canManageUsers: boolean;
  isEditingSelf: boolean;
  canManageTeams: boolean;
  userTeams: Array<{ id: string; name: string; color?: string }>;
  canManageAuthentication: boolean;
  isLookingUpAD: boolean;
  onLookupAzureAD: () => Promise<void>;
  canForcePasswordChange: boolean;
  show2FASetup: boolean;
  setShow2FASetup: (show: boolean) => void;
  isLoading: boolean;
  onDisable2FA: () => Promise<void>;
  preferences: UserPreferences | null;
  updatePreferenceInDB: (modelType: string, updates: UnifiedUserPreferenceUpdates) => Promise<void>;
  handleResetPreference: (modelType: string) => Promise<void>;
  sidebarShowAssigned: boolean;
  saveSidebarPref: (checked: boolean) => Promise<void>;
  isPrefsLoading: boolean;
}

export function UnifiedUserModalTabContent({
  activeTab,
  form,
  mode,
  user,
  customFields,
  customFieldDefinitions,
  onCustomFieldChange,
  userGroups,
  isLoadingGroups,
  canManageUsers,
  isEditingSelf,
  canManageTeams,
  userTeams,
  canManageAuthentication,
  isLookingUpAD,
  onLookupAzureAD,
  canForcePasswordChange,
  show2FASetup,
  setShow2FASetup,
  isLoading,
  onDisable2FA,
  preferences,
  updatePreferenceInDB,
  handleResetPreference,
  sidebarShowAssigned,
  saveSidebarPref,
  isPrefsLoading,
}: UnifiedUserModalTabContentProps) {
  return (
    <div className="flex-1 overflow-hidden relative">
      <ScrollArea className="h-full w-full">
        <div className="p-4 max-w-5xl mx-auto space-y-4 pb-16">
          {activeTab === "hiring" && user?.id ? (
            <HiringDetailTab userId={user.id} />
          ) : (
            <>
              <TabsContent value="personal" className={UNIFIED_USER_TAB_CONTENT_CLASS}>
                <ProfileTab
                  form={form}
                  mode={mode}
                  user={user}
                  customFields={customFields}
                  customFieldDefinitions={customFieldDefinitions}
                  onCustomFieldChange={onCustomFieldChange}
                />
              </TabsContent>

              <TabsContent value="account" className={UNIFIED_USER_ACCOUNT_TAB_CONTENT_CLASS}>
                <UserManagementForm
                  form={form}
                  userGroups={userGroups}
                  isLoadingGroups={isLoadingGroups}
                  canManageUsers={canManageUsers}
                  isEditingSelf={isEditingSelf}
                  canManageTeams={canManageTeams}
                  userTeams={userTeams}
                  canManageAuthentication={canManageAuthentication}
                  isLookingUpAD={isLookingUpAD}
                  handleLookupAzureAD={onLookupAzureAD}
                />
              </TabsContent>

              <TabsContent value="security" className={UNIFIED_USER_TAB_CONTENT_CLASS}>
                <SecurityTab
                  form={form}
                  user={user}
                  canForcePasswordChange={canForcePasswordChange}
                  show2FASetup={show2FASetup}
                  setShow2FASetup={setShow2FASetup}
                  isLoading={isLoading}
                  handleDisable2FA={onDisable2FA}
                />
              </TabsContent>

              <TabsContent value="preferences" className={UNIFIED_USER_TAB_CONTENT_CLASS}>
                <PreferencesTab
                  preferences={preferences}
                  updatePreferenceInDB={updatePreferenceInDB}
                  handleResetPreference={handleResetPreference}
                  sidebarShowAssigned={sidebarShowAssigned}
                  saveSidebarPref={saveSidebarPref}
                  isPrefsLoading={isPrefsLoading}
                />
              </TabsContent>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
