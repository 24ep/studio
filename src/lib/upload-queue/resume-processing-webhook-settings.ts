import { getSystemSetting } from '@/lib/systemSettings';

export interface ResumeProcessingWebhookSettings {
  mode: 'built-in' | 'external';
  builtInProcessorNodeName: string;
  builtInResumeExtractionPrompt: string;
  builtInApplicantMappingPrompt: string;
  builtInJobMatchingPrompt: string;
  url: string;
  token: string;
  responseMode: string;
}

export async function getResumeProcessingWebhookSettings(): Promise<ResumeProcessingWebhookSettings> {
  const [
    configuredMode,
    builtInProcessorNodeName,
    builtInResumeExtractionPrompt,
    builtInApplicantMappingPrompt,
    builtInJobMatchingPrompt,
    configuredUrl,
    configuredToken,
    configuredResponseMode,
  ] = await Promise.all([
    getSystemSetting('resumeProcessingMode'),
    getSystemSetting('builtInProcessorNodeName'),
    getSystemSetting('builtInResumeExtractionPrompt'),
    getSystemSetting('builtInApplicantMappingPrompt'),
    getSystemSetting('builtInJobMatchingPrompt'),
    getSystemSetting('resumeProcessingWebhookUrl'),
    getSystemSetting('resumeProcessingWebhookToken'),
    getSystemSetting('resumeProcessingWebhookResponseMode'),
  ]);

  return {
    mode: configuredMode === 'external' ? 'external' : 'built-in',
    builtInProcessorNodeName: builtInProcessorNodeName || 'Default built-in processor',
    builtInResumeExtractionPrompt: builtInResumeExtractionPrompt || '',
    builtInApplicantMappingPrompt: builtInApplicantMappingPrompt || '',
    builtInJobMatchingPrompt: builtInJobMatchingPrompt || '',
    url: configuredUrl || process.env.RESUME_PROCESSING_WEBHOOK_URL || '',
    token: configuredToken || process.env.RESUME_PROCESSING_WEBHOOK_TOKEN || '',
    responseMode: configuredResponseMode || 'blocking',
  };
}
