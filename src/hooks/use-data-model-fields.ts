import { useState, useEffect } from 'react';
import type { DataModelField } from '@/lib/dataModelUtils';

interface UseDataModelFieldsOptions {
  modelType: 'candidate' | 'position' | 'user';
  enabled?: boolean;
}

interface UseDataModelFieldsReturn {
  fields: DataModelField[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDataModelFields({ 
  modelType, 
  enabled = true 
}: UseDataModelFieldsOptions): UseDataModelFieldsReturn {
  const [fields, setFields] = useState<DataModelField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/settings/data-models/fields?type=${modelType}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch data model fields');
      }
      
      const data = await response.json();
      setFields(data.fields || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching data model fields');
      setFields([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [modelType, enabled]);

  const refetch = () => {
    fetchFields();
  };

  return {
    fields,
    isLoading,
    error,
    refetch
  };
} 