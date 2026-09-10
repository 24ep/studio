import { toast, ToastOptions } from 'react-hot-toast';
import { useDynamicZIndex } from '@/contexts/ZIndexContext';

interface ToastWithDescriptionOptions extends ToastOptions {
  description?: string;
}

export function useToast() {
  // Register with z-index system to ensure toasts appear above everything
  const { contentZIndex } = useDynamicZIndex('toast-hook', 'overlay');
  
  // Show a toast with a message and optional options
  const show = (message: string, options?: ToastOptions) => {
    toast(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  // Show a success toast
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  // Show an error toast
  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  // Show a loading toast
  const loading = (message: string, options?: ToastOptions) => {
    toast.loading(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  /**
   * Show a toast with title and description
   * @param title - The main title of the toast
   * @param description - Optional description text below the title
   * @param options - Optional toast configuration
   * 
   * @example
   * ```tsx
   * const { showWithDescription } = useToast();
   * showWithDescription("File Uploaded", "Your document has been successfully processed.");
   * ```
   */
  const showWithDescription = (title: string, description?: string, options?: ToastWithDescriptionOptions) => {
    const message = description ? `${title}\n${description}` : title;
    toast(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  /**
   * Show a success toast with title and description
   * @param title - The main title of the toast
   * @param description - Optional description text below the title
   * @param options - Optional toast configuration
   * 
   * @example
   * ```tsx
   * const { successWithDescription } = useToast();
   * successWithDescription("Success!", "Your changes have been saved successfully.");
   * ```
   */
  const successWithDescription = (title: string, description?: string, options?: ToastWithDescriptionOptions) => {
    const message = description ? `${title}\n${description}` : title;
    toast.success(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  /**
   * Show an error toast with title and description
   * @param title - The main title of the toast
   * @param description - Optional description text below the title
   * @param options - Optional toast configuration
   * 
   * @example
   * ```tsx
   * const { errorWithDescription } = useToast();
   * errorWithDescription("Upload Failed", "Please check your connection and try again.");
   * ```
   */
  const errorWithDescription = (title: string, description?: string, options?: ToastWithDescriptionOptions) => {
    const message = description ? `${title}\n${description}` : title;
    toast.error(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  // Dismiss all toasts
  const dismiss = () => {
    toast.dismiss();
  };

  // Dismiss a specific toast by ID
  const dismissById = (toastId: string) => {
    toast.dismiss(toastId);
  };

  // Clear all toasts and return the toast ID for potential dismissal
  const showWithId = (message: string, options?: ToastOptions) => {
    return toast(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  const successWithId = (message: string, options?: ToastOptions) => {
    return toast.success(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  const errorWithId = (message: string, options?: ToastOptions) => {
    return toast.error(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  const loadingWithId = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...options,
      style: {
        ...options?.style,
        zIndex: contentZIndex,
      },
    });
  };

  return { 
    show, 
    success, 
    error, 
    loading, 
    showWithDescription,
    successWithDescription,
    errorWithDescription,
    dismiss,
    dismissById,
    showWithId,
    successWithId,
    errorWithId,
    loadingWithId
  };
} 
