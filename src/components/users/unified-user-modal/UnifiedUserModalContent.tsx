"use client";

import { Form } from '@/components/ui/form';
import { Tabs } from '@/components/ui/tabs';
import type { UserProfile } from '@/lib/types';

import { UnifiedUserModalHeader, UnifiedUserModalTabsList } from './UnifiedUserModalParts';
import { UnifiedUserModalTabContent } from './UnifiedUserModalTabContent';
import { type ModalMode, type UnifiedUserFormValues } from './types';
import { useUnifiedUserModalController } from './use-unified-user-modal-controller';

interface UnifiedUserModalContentProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: ModalMode;
  user?: UserProfile | null;
  onSave: (data: UnifiedUserFormValues) => Promise<void>;
  onEditUser?: (userId: string, data: UnifiedUserFormValues) => Promise<void>;
  onAddUser?: (data: UnifiedUserFormValues) => Promise<void>;
}

export function UnifiedUserModalContent({
  isOpen,
  onOpenChange,
  mode,
  user,
  onSave,
  onEditUser,
  onAddUser,
}: UnifiedUserModalContentProps) {
  const controller = useUnifiedUserModalController({
    isOpen,
    mode,
    user,
    onSave,
    onEditUser,
    onAddUser,
  });
  const { form, permissions } = controller;
  const { isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(controller.onSubmit)}
        className="flex-1 flex flex-col min-h-0 bg-background h-full"
      >
        <UnifiedUserModalHeader
          form={form}
          user={user}
          mode={mode}
          isSaving={isSubmitting || controller.isLoading}
          onClose={() => onOpenChange(false)}
        />

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs
            value={controller.activeTab}
            onValueChange={controller.setActiveTab}
            className="flex-1 flex flex-col h-full bg-background/50"
          >
            <UnifiedUserModalTabsList mode={mode} user={user} />
            <UnifiedUserModalTabContent
              activeTab={controller.activeTab}
              form={form}
              mode={mode}
              user={user}
              customFields={controller.customFields}
              customFieldDefinitions={controller.customFieldDefinitions}
              onCustomFieldChange={controller.handleCustomFieldChange}
              userGroups={controller.userGroups}
              isLoadingGroups={controller.isLoadingGroups}
              canManageUsers={permissions.canManageUsers}
              isEditingSelf={permissions.isEditingSelf}
              canManageTeams={permissions.canManageTeams}
              userTeams={controller.userTeams}
              canManageAuthentication={permissions.canManageAuthentication}
              isLookingUpAD={controller.isLookingUpAD}
              onLookupAzureAD={controller.handleLookupAzureAD}
              canForcePasswordChange={permissions.canForcePasswordChange}
              show2FASetup={controller.show2FASetup}
              setShow2FASetup={controller.setShow2FASetup}
              isLoading={controller.isLoading}
              onDisable2FA={controller.handleDisable2FA}
              preferences={controller.preferences}
              updatePreferenceInDB={controller.updatePreferenceInDB}
              handleResetPreference={controller.handleResetPreference}
              sidebarShowAssigned={controller.sidebarShowAssigned}
              saveSidebarPref={controller.saveSidebarPref}
              isPrefsLoading={controller.isPrefsLoading}
            />
          </Tabs>
        </div>
      </form>
    </Form>
  );
}
