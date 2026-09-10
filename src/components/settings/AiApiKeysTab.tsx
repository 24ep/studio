"use client";

import {
  AiApiKeysAccordion,
  AiApiKeysLoadingState,
} from "./AiApiKeysTabParts";
import { useAiApiKeysTab } from "./use-ai-api-keys-tab";

export default function AiApiKeysTab() {
  const {
    apiKeys,
    availableModels,
    deletingKey,
    editingKey,
    editValue,
    hasLoadedOnce,
    isFetchingModels,
    isLoading,
    isSaving,
    newApiKey,
    newPriority,
    providerDefaultModel,
    providerLabel,
    selectedProvider,
    actions,
  } = useAiApiKeysTab();

  if (isLoading && !hasLoadedOnce) {
    return <AiApiKeysLoadingState />;
  }

  return (
    <div className="space-y-6">
      <AiApiKeysAccordion
        apiKeys={apiKeys}
        availableModels={availableModels}
        deletingKey={deletingKey}
        editingKey={editingKey}
        editValue={editValue}
        isFetchingModels={isFetchingModels}
        isLoading={isLoading}
        isSaving={isSaving}
        newApiKey={newApiKey}
        newPriority={newPriority}
        providerDefaultModel={providerDefaultModel}
        providerLabel={providerLabel}
        selectedProvider={selectedProvider}
        actions={actions}
      />
    </div>
  );
}
