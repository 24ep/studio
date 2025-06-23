import { toast, ToastOptions } from 'react-hot-toast';

export function useToast() {
  // Show a toast with a message and optional options
  const show = (message: string, options?: ToastOptions) => {
    toast(message, options);
  };

  // Show a success toast
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, options);
  };

  // Show an error toast
  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, options);
  };

  // Show a loading toast
  const loading = (message: string, options?: ToastOptions) => {
    toast.loading(message, options);
  };

  // Dismiss all toasts
  const dismiss = () => {
    toast.dismiss();
  };

  return { show, success, error, loading, dismiss };
} 