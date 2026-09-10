"use client";

import { useEffect } from 'react';

import { OPEN_SYSTEM_API_KEY_CREATION_EVENT } from './system-api-key-events';
import {
  CreatedSystemApiKeyDialog,
  CreateSystemApiKeyDialog,
  DeleteSystemApiKeyDialog,
  SystemApiKeysAccordion,
  SystemApiKeysLoadingState,
} from "./SystemApiKeysTabParts";
import { useSystemApiKeysTab } from "./use-system-api-keys-tab";

export default function SystemApiKeysTab() {
  const {
    apiKeys,
    createdKey,
    createdKeyName,
    deleteConfirmId,
    deletingId,
    isLoading,
    isSaving,
    newKeyCustomExpiration,
    newKeyDescription,
    newKeyExpiration,
    newKeyName,
    showCreatedKey,
    showCreatedKeyDialog,
    showCreateDialog,
    togglingId,
    actions,
  } = useSystemApiKeysTab();
  const openCreateDialog = actions.setShowCreateDialog;

  useEffect(() => {
    const handleAdminCenterAction = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin
        || event.source !== window.parent
        || event.data?.type !== OPEN_SYSTEM_API_KEY_CREATION_EVENT
      ) return;

      openCreateDialog(true);
    };

    window.addEventListener('message', handleAdminCenterAction);
    return () => window.removeEventListener('message', handleAdminCenterAction);
  }, [openCreateDialog]);

  if (isLoading) {
    return <SystemApiKeysLoadingState />;
  }

  return (
    <div className="space-y-6">
      <SystemApiKeysAccordion
        apiKeys={apiKeys}
        deletingId={deletingId}
        togglingId={togglingId}
        actions={actions}
      />
      <CreateSystemApiKeyDialog
        open={showCreateDialog}
        isSaving={isSaving}
        newKeyCustomExpiration={newKeyCustomExpiration}
        newKeyDescription={newKeyDescription}
        newKeyExpiration={newKeyExpiration}
        newKeyName={newKeyName}
        actions={actions}
      />
      <CreatedSystemApiKeyDialog
        open={showCreatedKeyDialog}
        createdKey={createdKey}
        createdKeyName={createdKeyName}
        showCreatedKey={showCreatedKey}
        actions={actions}
      />
      <DeleteSystemApiKeyDialog
        deleteConfirmId={deleteConfirmId}
        actions={actions}
      />
    </div>
  );
}
