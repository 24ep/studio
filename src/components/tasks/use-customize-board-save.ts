import { useCallback } from 'react';

import { useToast } from '@/hooks/use-toast';
import { buildCustomizeBoardPreferences } from './customize-board-utils';

interface UseCustomizeBoardSaveOptions {
  columnField: string;
  onOpenChange: (open: boolean) => void;
  rowField: string;
  setLoading: (loading: boolean) => void;
  visibleColumnValues: string[];
  visibleFields: string[];
  visibleRowValues: string[];
}

const TOAST_STYLE = {
  background: 'hsl(var(--background))',
  color: 'hsl(var(--foreground))',
  border: '1px solid hsl(var(--border))',
};

const ERROR_TOAST_STYLE = {
  background: 'hsl(var(--destructive))',
  color: 'hsl(var(--destructive-foreground))',
  border: '1px solid hsl(var(--destructive))',
};

function getCustomizeBoardSaveErrorMessage(error: unknown) {
  if (error instanceof Error && error.name === 'AbortError') {
    return 'Request timed out. Please try again.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Failed to save preferences';
}

export function useCustomizeBoardSave({
  columnField,
  onOpenChange,
  rowField,
  setLoading,
  visibleColumnValues,
  visibleFields,
  visibleRowValues,
}: UseCustomizeBoardSaveOptions) {
  const { show: toast } = useToast();

  return useCallback(async () => {
    setLoading(true);

    try {
      const prefs = buildCustomizeBoardPreferences({
        columnField,
        rowField,
        visibleColumnValues,
        visibleFields,
        visibleRowValues,
      });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/settings/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save preferences: ${response.status} ${errorText}`);
      }

      toast('Preferences saved! Your board customization has been applied.', {
        duration: 4000,
        style: TOAST_STYLE,
      });
      onOpenChange(false);
    } catch (error: unknown) {
      toast(getCustomizeBoardSaveErrorMessage(error), {
        duration: 4000,
        style: ERROR_TOAST_STYLE,
      });
    } finally {
      setLoading(false);
    }
  }, [
    columnField,
    onOpenChange,
    rowField,
    setLoading,
    toast,
    visibleColumnValues,
    visibleFields,
    visibleRowValues,
  ]);
}
