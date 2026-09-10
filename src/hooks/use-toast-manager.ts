import { useCallback, useRef } from 'react';
import { toast, ToastOptions } from 'react-hot-toast';
import { useDynamicZIndex } from '@/contexts/ZIndexContext';

interface ToastManagerOptions {
  deduplicationWindowMs?: number; // Time window to prevent duplicate toasts
  maxRecentToasts?: number; // Maximum number of recent toasts to track
}

interface RecentToast {
  message: string;
  type: string;
  timestamp: number;
}

export function useToastManager(options: ToastManagerOptions = {}) {
  const {
    deduplicationWindowMs = 3000, // 3 seconds default
    maxRecentToasts = 10,
  } = options;

  // Register with z-index system to ensure toasts appear above everything
  const { contentZIndex } = useDynamicZIndex('toast-manager', 'overlay');

  const recentToastsRef = useRef<RecentToast[]>([]);

  const isDuplicate = useCallback((message: string, type: string): boolean => {
    const now = Date.now();
    const recentToasts = recentToastsRef.current;
    
    // Remove old toasts outside the deduplication window
    const validToasts = recentToasts.filter(
      recentToast => (now - recentToast.timestamp) < deduplicationWindowMs
    );
    
    // Check if this exact message and type was shown recently
    const isDuplicate = validToasts.some(
      recentToast => recentToast.message === message && recentToast.type === type
    );
    
    // Update recent toasts list
    recentToastsRef.current = validToasts;
    
    return isDuplicate;
  }, [deduplicationWindowMs]);

  const addToRecent = useCallback((message: string, type: string) => {
    const now = Date.now();
    const newToast: RecentToast = { message, type, timestamp: now };
    
    recentToastsRef.current = [
      newToast,
      ...recentToastsRef.current.slice(0, maxRecentToasts - 1)
    ];
  }, [maxRecentToasts]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'loading' | 'info' = 'info', options?: ToastOptions) => {
    if (isDuplicate(message, type)) {
      return;
    }

    addToRecent(message, type);
    
    const toastOptions = {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    };
    
    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'loading':
        toast.loading(message, toastOptions);
        break;
      default:
        toast(message, toastOptions);
    }
  }, [isDuplicate, addToRecent, contentZIndex]);

  const success = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'success', options);
  }, [showToast]);

  const error = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'error', options);
  }, [showToast]);

  const loading = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'loading', options);
  }, [showToast]);

  const info = useCallback((message: string, options?: ToastOptions) => {
    showToast(message, 'info', options);
  }, [showToast]);

  const clearRecent = useCallback(() => {
    recentToastsRef.current = [];
  }, []);

  // Clear all toasts
  const clearAll = useCallback(() => {
    toast.dismiss();
    clearRecent();
  }, [clearRecent]);

  // Show toast with ID for potential dismissal
  const showToastWithId = useCallback((message: string, type: 'success' | 'error' | 'loading' | 'info' = 'info', options?: ToastOptions) => {
    if (isDuplicate(message, type)) {
      return null;
    }

    addToRecent(message, type);
    
    const toastOptions = {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    };
    
    let toastId: string | undefined;
    switch (type) {
      case 'success':
        toastId = toast.success(message, toastOptions);
        break;
      case 'error':
        toastId = toast.error(message, toastOptions);
        break;
      case 'loading':
        toastId = toast.loading(message, toastOptions);
        break;
      default:
        toastId = toast(message, toastOptions);
    }
    
    return toastId;
  }, [isDuplicate, addToRecent, contentZIndex]);

  return {
    showToast,
    success,
    error,
    loading,
    info,
    clearRecent,
    clearAll,
    showToastWithId,
    isDuplicate,
  };
}
