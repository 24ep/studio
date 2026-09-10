// Queue Settings Validator
// Ensures critical queue settings are valid and prevents queue from getting stuck

import { getSystemSetting } from '@/lib/systemSettings';

export interface QueueSettingsValidation {
  maxConcurrentProcessors: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates and fixes critical queue settings
 */
export async function validateAndFixQueueSettings(): Promise<QueueSettingsValidation> {
  const result: QueueSettingsValidation = {
    maxConcurrentProcessors: 5,
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    // Validate maxConcurrentProcessors
    const maxConcurrentSetting = await getSystemSetting('maxConcurrentProcessors');
    
    if (!maxConcurrentSetting) {
      result.warnings.push('maxConcurrentProcessors setting is missing, setting to default value 5');
      // Note: Setting is missing, using default. Consider implementing setSystemSetting to persist default value.
      result.maxConcurrentProcessors = 5;
    } else {
      const maxConcurrent = parseInt(maxConcurrentSetting, 10);
      
      if (isNaN(maxConcurrent)) {
        result.errors.push(`maxConcurrentProcessors is not a valid number: ${maxConcurrentSetting}`);
        result.isValid = false;
        // Note: Setting is missing, using default. Consider implementing setSystemSetting to persist default value.
        result.maxConcurrentProcessors = 5;
      } else if (maxConcurrent <= 0) {
        result.errors.push(`maxConcurrentProcessors is ${maxConcurrent}, which prevents all job processing`);
        result.isValid = false;
        // Note: Setting is missing, using default. Consider implementing setSystemSetting to persist default value.
        result.maxConcurrentProcessors = 5;
      } else if (maxConcurrent > 20) {
        result.warnings.push(`maxConcurrentProcessors is ${maxConcurrent}, which may cause database connection issues`);
        result.maxConcurrentProcessors = maxConcurrent;
      } else {
        result.maxConcurrentProcessors = maxConcurrent;
      }
    }

    // Validate other critical settings
    // Note: processorIntervalMs is not in SystemSettingKey type, so we skip validation
    // Future enhancement: Add processorIntervalMs to SystemSettingKey type if this setting is needed


  } catch (error) {
    result.errors.push(`Failed to validate queue settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.isValid = false;
  }

  return result;
}

/**
 * Logs queue settings validation results
 */
export function logQueueSettingsValidation(result: QueueSettingsValidation): void {
  if (result.errors.length > 0) {
    console.error('Queue Settings Validation Errors:', result.errors);
  }
  
  if (result.warnings.length > 0) {
    console.warn('Queue Settings Validation Warnings:', result.warnings);
  }
  
  if (result.isValid && result.warnings.length === 0) {
    // console.log('Queue settings validation passed');
  }
  
  // console.log(`Current maxConcurrentProcessors: ${result.maxConcurrentProcessors}`);
}

/**
 * Validates queue settings on startup
 */
export async function validateQueueSettingsOnStartup(): Promise<void> {
  // console.log('Validating queue settings...');
  const result = await validateAndFixQueueSettings();
  logQueueSettingsValidation(result);
  
  if (!result.isValid) {
    console.error('Critical queue settings issues found and fixed');
  }
}
