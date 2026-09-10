"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import {
  AIPowerSearchConfigTrigger,
  AIPowerSearchInfoAlert,
  AIPowerSearchPromptActions,
  AIPowerSearchPromptContent,
} from './AIPowerSearchTabParts';
import { useAiPowerSearchPrompt } from './use-ai-power-search-prompt';

export default function AIPowerSearchTab() {
  const {
    currentPrompt,
    error,
    handleDone,
    handleReset,
    isEditing,
    isLoading,
    isSaving,
    setCurrentPrompt,
    setIsEditing,
  } = useAiPowerSearchPrompt();

  return (
    <div className="space-y-6">
      <AIPowerSearchInfoAlert />

      <Accordion type="multiple" defaultValue={['config']} className="w-full">
        <AccordionItem value="config" className="border-b">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
            <AIPowerSearchConfigTrigger />
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4 pt-2">
            <AIPowerSearchPromptActions
              isEditing={isEditing}
              isSaving={isSaving}
              onDone={handleDone}
              onEdit={() => setIsEditing(true)}
              onReset={handleReset}
            />

            <AIPowerSearchPromptContent
              currentPrompt={currentPrompt}
              error={error}
              isEditing={isEditing}
              isLoading={isLoading}
              onPromptChange={setCurrentPrompt}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
