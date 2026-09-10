"use client";

import {
  AiConfigurationError,
  AiConfigurationHeader,
  AiConfigurationSaveButton,
  AiModelSelectionCard,
  AiSearchSystemPromptCard,
} from './AiConfigurationTabParts';
import { useAiConfigurationTab } from './use-ai-configuration-tab';

export default function AiConfigurationTab() {
  const controller = useAiConfigurationTab();

  return (
    <div className="space-y-6">
      <AiConfigurationHeader />

      <AiConfigurationError error={controller.error} />

      <div className="grid gap-6">
        <AiModelSelectionCard
          availableModels={controller.availableModels}
          currentModel={controller.currentModel}
          selectedModel={controller.selectedModel}
          onSelectedModelChange={controller.setSelectedModel}
        />

        <AiSearchSystemPromptCard
          systemPrompt={controller.systemPrompt}
          onSystemPromptChange={controller.setSystemPrompt}
        />

        <AiConfigurationSaveButton
          isLoading={controller.isLoading}
          isSaving={controller.isSaving}
          onSave={controller.saveConfiguration}
        />
      </div>
    </div>
  );
}
