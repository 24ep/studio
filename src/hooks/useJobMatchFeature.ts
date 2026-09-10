import { useState, useEffect } from 'react';
import { isSystemSettingEnabled } from '@/lib/system-settings-response';

const JOB_MATCH_FEATURE_KEY = 'jobMatchFeatureEnabled';

export const useJobMatchFeature = () => {
  const [isJobMatchEnabled, setIsJobMatchEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkJobMatchFeature = async () => {
      try {
        const response = await fetch(`/api/settings/system-settings?keys=${JOB_MATCH_FEATURE_KEY}`);
        if (response.ok) {
          const data: unknown = await response.json();
          setIsJobMatchEnabled(isSystemSettingEnabled(data, JOB_MATCH_FEATURE_KEY, true));
        }
      } catch (error) {
        console.error('Error checking job match feature status:', error);
        // Default to enabled on error
        setIsJobMatchEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkJobMatchFeature();
  }, []);

  return { isJobMatchEnabled, isLoading };
};
