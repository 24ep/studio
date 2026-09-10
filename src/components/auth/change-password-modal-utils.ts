import * as z from 'zod';

export const CHANGE_PASSWORD_FAILURE_MESSAGE = 'Failed to change password.';
export const CHANGE_PASSWORD_SUCCESS_MESSAGE = 'Your password has been successfully updated.';
export const CHANGE_PASSWORD_SUBMIT_IDLE_LABEL = 'Update Password';
export const CHANGE_PASSWORD_SUBMIT_LOADING_LABEL = 'Updating...';

export const changePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmNewPassword: z.string().min(8, 'Please confirm your new password'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword'],
});

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export const CHANGE_PASSWORD_DEFAULT_VALUES: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

export const CHANGE_PASSWORD_FIELDS: ReadonlyArray<{
  name: keyof ChangePasswordFormValues;
  label: string;
}> = [
  { name: 'currentPassword', label: 'Current Password' },
  { name: 'newPassword', label: 'New Password' },
  { name: 'confirmNewPassword', label: 'Confirm New Password' },
] as const;

export function buildChangePasswordRequestBody(data: ChangePasswordFormValues) {
  return {
    currentPassword: data.currentPassword,
    newPassword: data.newPassword,
  };
}

export function getChangePasswordErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : CHANGE_PASSWORD_FAILURE_MESSAGE;
}

export function getChangePasswordSubmitLabel(isSubmitting: boolean) {
  return isSubmitting ? CHANGE_PASSWORD_SUBMIT_LOADING_LABEL : CHANGE_PASSWORD_SUBMIT_IDLE_LABEL;
}

export function getChangePasswordFormClassName(isMobile: boolean) {
  return isMobile ? 'space-y-4 py-2 px-4' : 'space-y-4 py-2';
}

export function getChangePasswordSubmitButtonClassName(isMobile: boolean) {
  return isMobile ? 'btn-primary-gradient w-full' : 'btn-primary-gradient';
}

export function shouldResetChangePasswordForm(open: boolean) {
  return !open;
}
