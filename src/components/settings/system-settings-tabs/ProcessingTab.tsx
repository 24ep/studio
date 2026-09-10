"use client";

import { toast } from 'react-hot-toast';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  BuiltInFlowConfigTitle,
  BuiltInFlowSettingsSection,
  ProcessingConfigSection,
  ProcessingConfigTitle,
  WebhookConfigTitle,
  WebhookSettingsSection
} from './ProcessingTabParts';
import type { ProcessingTabProps } from './processing-tab-types';
import { getWebhookTestToastMessage, testProcessingWebhook } from './processing-tab-utils';

export default function ProcessingTab({
  resumeProcessingMode,
  setResumeProcessingMode,
  builtInProcessorNodeName,
  setBuiltInProcessorNodeName,
  builtInResumeExtractionPrompt,
  setBuiltInResumeExtractionPrompt,
  builtInApplicantMappingPrompt,
  setBuiltInApplicantMappingPrompt,
  builtInJobMatchingPrompt,
  setBuiltInJobMatchingPrompt,
  maxConcurrentProcessors,
  setMaxConcurrentProcessors,
  dataOperationsMaxConcurrentJobs,
  setDataOperationsMaxConcurrentJobs,
  dataOperationsMaxQueuedJobsPerUser,
  setDataOperationsMaxQueuedJobsPerUser,
  dataOperationsMaxImportFileSizeMb,
  setDataOperationsMaxImportFileSizeMb,
  dataOperationsJobRetentionDays,
  setDataOperationsJobRetentionDays,
  resumeProcessingWebhookUrl,
  setResumeProcessingWebhookUrl,
  resumeProcessingWebhookToken,
  setResumeProcessingWebhookToken,
  resumeProcessingWebhookResponseMode,
  setResumeProcessingWebhookResponseMode,
  resumeProcessingWebhookTimeout,
  setResumeProcessingWebhookTimeout,
  showWebhookToken,
  setShowWebhookToken,
  isSaving
}: ProcessingTabProps) {
  const handleTestWebhook = async () => {
    if (!resumeProcessingWebhookUrl) {
      toast.error('Please enter a webhook URL first');
      return;
    }

    try {
      const result = await testProcessingWebhook(resumeProcessingWebhookUrl, resumeProcessingWebhookToken);
      const toastMessage = getWebhookTestToastMessage(result);

      if (toastMessage.type === 'success') {
        toast.success(toastMessage.message);
      } else {
        toast.error(toastMessage.message);
      }
    } catch {
      toast.error('Failed to test webhook');
    }
  };

  return (
    <ScrollArea className="h-full">
      <Accordion
        key={resumeProcessingMode}
        type="multiple"
        defaultValue={resumeProcessingMode === 'external'
          ? ['processing-config', 'webhook']
          : ['processing-config', 'built-in-flow']}
        className="w-full"
      >
        <AccordionItem value="processing-config" className="border-b">
          <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
            <ProcessingConfigTitle />
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4 pt-2">
            <ProcessingConfigSection
              resumeProcessingMode={resumeProcessingMode}
              setResumeProcessingMode={setResumeProcessingMode}
              maxConcurrentProcessors={maxConcurrentProcessors}
              setMaxConcurrentProcessors={setMaxConcurrentProcessors}
              dataOperationsMaxConcurrentJobs={dataOperationsMaxConcurrentJobs}
              setDataOperationsMaxConcurrentJobs={setDataOperationsMaxConcurrentJobs}
              dataOperationsMaxQueuedJobsPerUser={dataOperationsMaxQueuedJobsPerUser}
              setDataOperationsMaxQueuedJobsPerUser={setDataOperationsMaxQueuedJobsPerUser}
              dataOperationsMaxImportFileSizeMb={dataOperationsMaxImportFileSizeMb}
              setDataOperationsMaxImportFileSizeMb={setDataOperationsMaxImportFileSizeMb}
              dataOperationsJobRetentionDays={dataOperationsJobRetentionDays}
              setDataOperationsJobRetentionDays={setDataOperationsJobRetentionDays}
              isSaving={isSaving}
            />
          </AccordionContent>
        </AccordionItem>

        {resumeProcessingMode === 'built-in' && (
          <AccordionItem value="built-in-flow" className="border-b">
            <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
              <BuiltInFlowConfigTitle />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 pt-2">
              <BuiltInFlowSettingsSection
                builtInProcessorNodeName={builtInProcessorNodeName}
                setBuiltInProcessorNodeName={setBuiltInProcessorNodeName}
                builtInResumeExtractionPrompt={builtInResumeExtractionPrompt}
                setBuiltInResumeExtractionPrompt={setBuiltInResumeExtractionPrompt}
                builtInApplicantMappingPrompt={builtInApplicantMappingPrompt}
                setBuiltInApplicantMappingPrompt={setBuiltInApplicantMappingPrompt}
                builtInJobMatchingPrompt={builtInJobMatchingPrompt}
                setBuiltInJobMatchingPrompt={setBuiltInJobMatchingPrompt}
                isSaving={isSaving}
              />
            </AccordionContent>
          </AccordionItem>
        )}

        {resumeProcessingMode === 'external' && (
          <AccordionItem value="webhook" className="border-b">
            <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
              <WebhookConfigTitle />
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-4 pt-2">
              <WebhookSettingsSection
                resumeProcessingWebhookUrl={resumeProcessingWebhookUrl}
                setResumeProcessingWebhookUrl={setResumeProcessingWebhookUrl}
                resumeProcessingWebhookToken={resumeProcessingWebhookToken}
                setResumeProcessingWebhookToken={setResumeProcessingWebhookToken}
                resumeProcessingWebhookResponseMode={resumeProcessingWebhookResponseMode}
                setResumeProcessingWebhookResponseMode={setResumeProcessingWebhookResponseMode}
                resumeProcessingWebhookTimeout={resumeProcessingWebhookTimeout}
                setResumeProcessingWebhookTimeout={setResumeProcessingWebhookTimeout}
                showWebhookToken={showWebhookToken}
                setShowWebhookToken={setShowWebhookToken}
                isSaving={isSaving}
                onTestWebhook={handleTestWebhook}
              />
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </ScrollArea>
  );
}
