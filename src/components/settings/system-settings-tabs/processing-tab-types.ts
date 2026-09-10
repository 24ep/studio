export interface ProcessingTabProps {
  resumeProcessingMode: 'built-in' | 'external';
  setResumeProcessingMode: (val: 'built-in' | 'external') => void;
  builtInProcessorNodeName: string;
  setBuiltInProcessorNodeName: (val: string) => void;
  builtInResumeExtractionPrompt: string;
  setBuiltInResumeExtractionPrompt: (val: string) => void;
  builtInApplicantMappingPrompt: string;
  setBuiltInApplicantMappingPrompt: (val: string) => void;
  builtInJobMatchingPrompt: string;
  setBuiltInJobMatchingPrompt: (val: string) => void;
  maxConcurrentProcessors: number;
  setMaxConcurrentProcessors: (val: number) => void;
  dataOperationsMaxConcurrentJobs: number;
  setDataOperationsMaxConcurrentJobs: (val: number) => void;
  dataOperationsMaxQueuedJobsPerUser: number;
  setDataOperationsMaxQueuedJobsPerUser: (val: number) => void;
  dataOperationsMaxImportFileSizeMb: number;
  setDataOperationsMaxImportFileSizeMb: (val: number) => void;
  dataOperationsJobRetentionDays: number;
  setDataOperationsJobRetentionDays: (val: number) => void;
  resumeProcessingWebhookUrl: string;
  setResumeProcessingWebhookUrl: (val: string) => void;
  resumeProcessingWebhookToken: string;
  setResumeProcessingWebhookToken: (val: string) => void;
  resumeProcessingWebhookResponseMode: string;
  setResumeProcessingWebhookResponseMode: (val: string) => void;
  resumeProcessingWebhookTimeout: number;
  setResumeProcessingWebhookTimeout: (val: number) => void;
  showWebhookToken: boolean;
  setShowWebhookToken: (val: boolean) => void;
  isSaving: boolean;
}

export interface WebhookTestResponse {
  success?: boolean;
  responseTime?: string;
  error?: string;
}
