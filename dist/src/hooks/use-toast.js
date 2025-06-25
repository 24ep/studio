import { toast } from 'react-hot-toast';
export function useToast() {
    // Show a toast with a message and optional options
    const show = (message, options) => {
        toast(message, options);
    };
    // Show a success toast
    const success = (message, options) => {
        toast.success(message, options);
    };
    // Show an error toast
    const error = (message, options) => {
        toast.error(message, options);
    };
    // Show a loading toast
    const loading = (message, options) => {
        toast.loading(message, options);
    };
    // Dismiss all toasts
    const dismiss = () => {
        toast.dismiss();
    };
    return { show, success, error, loading, dismiss };
}
