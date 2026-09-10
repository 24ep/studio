import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useToastManager } from './use-toast-manager';
import { useToast } from './use-toast';

interface ModalSaveOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  closeModalDelay?: number;
  suppressSuccessToast?: boolean;
}

interface ModalSaveState {
  isSaving: boolean;
  save: <T>(saveFunction: () => Promise<T>) => Promise<T | undefined>;
  reset: () => void;
}

export function useModalSave(
  onOpenChange: (open: boolean) => void,
  options: ModalSaveOptions = {}
): ModalSaveState {
  const {
    onSuccess,
    onError,
    successMessage = 'Changes saved successfully!',
    errorMessage = 'Failed to save changes. Please try again.',
    loadingMessage = 'Saving...',
    closeModalDelay = 500,
    suppressSuccessToast = false
  } = options;

  const { success: showSuccessToast, error: showErrorToast } = useToastManager({
    deduplicationWindowMs: 2000
  });
  const { loadingWithId } = useToast();

  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const save = useCallback(async <T>(saveFunction: () => Promise<T>) => {
    if (isSavingRef.current) {
      return undefined;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    
    // Show loading toast
    const loadingToastId = loadingWithId(loadingMessage);
    
    // Create abort controller for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await saveFunction();
      
      // Dismiss loading toast
      if (loadingToastId) toast.dismiss(loadingToastId);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Show success toast unless suppressed
      if (!suppressSuccessToast) {
        showSuccessToast(successMessage, {
          duration: 3000,
          icon: "✅"
        });
      }
      
      // Close modal with delay for better UX
      setTimeout(() => {
        onOpenChange(false);
      }, closeModalDelay);
      
      return result;
    } catch (error) {
      // Dismiss loading toast
      if (loadingToastId) toast.dismiss(loadingToastId);
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Call error callback if provided
      if (onError) {
        onError(errorObj);
      }
      
      // Show error toast
      showErrorToast(errorMessage, {
        duration: 5000
      });
      
      throw errorObj;
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
      abortControllerRef.current = null;
    }
  }, [
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    loadingMessage,
    closeModalDelay,
    suppressSuccessToast,
    showSuccessToast,
    showErrorToast,
    loadingWithId,
    onOpenChange
  ]);

  const reset = useCallback(() => {
    isSavingRef.current = false;
    setIsSaving(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    isSaving,
    save,
    reset
  };
}
