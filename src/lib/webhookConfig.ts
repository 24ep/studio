// Webhook configuration
export const webhookConfig = {
  // Enable/disable webhooks globally
  enabled: process.env.WEBHOOKS_ENABLED !== 'false', // Default to true unless explicitly disabled
  
  // Timeout for webhook calls (in seconds)
  timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '30', 10),
  
  // Maximum retry attempts for failed webhooks
  maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10),
  
  // Retry delay base (in seconds)
  retryDelayBase: parseInt(process.env.WEBHOOK_RETRY_DELAY_BASE || '2', 10),
  
  // Maximum retry delay (in seconds)
  maxRetryDelay: parseInt(process.env.WEBHOOK_MAX_RETRY_DELAY || '10', 10),
  
  // Enable/disable specific webhook types
  types: {
    uploadQueue: process.env.WEBHOOK_UPLOAD_QUEUE_ENABLED !== 'false',
    applicant: process.env.WEBHOOK_APPLICANT_ENABLED !== 'false',
    position: process.env.WEBHOOK_POSITION_ENABLED !== 'false',
    user: process.env.WEBHOOK_USER_ENABLED !== 'false',
    resume: process.env.WEBHOOK_RESUME_ENABLED !== 'false',
    comment: process.env.WEBHOOK_COMMENT_ENABLED !== 'false'
  }
};

// Helper function to check if webhooks are enabled
export function areWebhooksEnabled(type?: keyof typeof webhookConfig.types): boolean {
  if (!webhookConfig.enabled) {
    return false;
  }
  
  if (type) {
    return webhookConfig.types[type];
  }
  
  return true;
} 
