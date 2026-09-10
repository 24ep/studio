"use client";

import { useSession } from 'next-auth/react';

import {
  SettingsErrorState,
  SettingsPermissionDenied,
} from '@/components/settings/SettingsTabState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { hasAnyPermission } from '@/lib/permissions';
import { CustomFieldsTabContent } from './CustomFieldsTabContent';
import { useCustomFieldsTabController } from './use-custom-fields-tab-controller';

export function CustomFieldsTab() {
  const { data: session } = useSession();
  const canManageCustomFields = hasAnyPermission(session?.user, ['CUSTOM_FIELDS_EDIT']);
  const controller = useCustomFieldsTabController(canManageCustomFields);

  if (!canManageCustomFields) {
    return (
      <SettingsPermissionDenied
        subject="custom fields"
        permission="CUSTOM_FIELDS_EDIT"
      />
    );
  }

  if (controller.fetchError) {
    return <SettingsErrorState message={controller.fetchError} />;
  }

  return (
    <ScrollArea className="h-full pr-4">
      <CustomFieldsTabContent {...controller} />
    </ScrollArea>
  );
}
