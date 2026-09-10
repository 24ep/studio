import { describe, expect, it } from 'vitest';
import {
  CHANGE_PASSWORD_DEFAULT_VALUES,
  CHANGE_PASSWORD_FAILURE_MESSAGE,
  CHANGE_PASSWORD_FIELDS,
  CHANGE_PASSWORD_SUBMIT_IDLE_LABEL,
  CHANGE_PASSWORD_SUBMIT_LOADING_LABEL,
  buildChangePasswordRequestBody,
  changePasswordFormSchema,
  getChangePasswordErrorMessage,
  getChangePasswordFormClassName,
  getChangePasswordSubmitButtonClassName,
  getChangePasswordSubmitLabel,
  shouldResetChangePasswordForm,
} from './change-password-modal-utils';

const validFormValues = {
  currentPassword: 'current-password',
  newPassword: 'new-password',
  confirmNewPassword: 'new-password',
};

describe('change-password-modal-utils', () => {
  it('validates matching password form values', () => {
    expect(changePasswordFormSchema.safeParse(validFormValues).success).toBe(true);
    expect(changePasswordFormSchema.safeParse({
      ...validFormValues,
      confirmNewPassword: 'different-password',
    }).success).toBe(false);
    expect(changePasswordFormSchema.safeParse({
      ...validFormValues,
      newPassword: 'short',
      confirmNewPassword: 'short',
    }).success).toBe(false);
  });

  it('defines default values and field metadata for every password field', () => {
    expect(CHANGE_PASSWORD_DEFAULT_VALUES).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    expect(CHANGE_PASSWORD_FIELDS.map(field => field.name)).toEqual([
      'currentPassword',
      'newPassword',
      'confirmNewPassword',
    ]);
  });

  it('builds the API payload without echoing confirmation password', () => {
    expect(buildChangePasswordRequestBody(validFormValues)).toEqual({
      currentPassword: 'current-password',
      newPassword: 'new-password',
    });
  });

  it('extracts thrown error messages with fallback text', () => {
    expect(getChangePasswordErrorMessage(new Error('Network failed'))).toBe('Network failed');
    expect(getChangePasswordErrorMessage('plain string')).toBe(CHANGE_PASSWORD_FAILURE_MESSAGE);
  });

  it('derives submit labels and layout classes', () => {
    expect(getChangePasswordSubmitLabel(false)).toBe(CHANGE_PASSWORD_SUBMIT_IDLE_LABEL);
    expect(getChangePasswordSubmitLabel(true)).toBe(CHANGE_PASSWORD_SUBMIT_LOADING_LABEL);
    expect(getChangePasswordFormClassName(false)).toBe('space-y-4 py-2');
    expect(getChangePasswordFormClassName(true)).toBe('space-y-4 py-2 px-4');
    expect(getChangePasswordSubmitButtonClassName(false)).toBe('btn-primary-gradient');
    expect(getChangePasswordSubmitButtonClassName(true)).toBe('btn-primary-gradient w-full');
  });

  it('resets the form only when the modal closes', () => {
    expect(shouldResetChangePasswordForm(false)).toBe(true);
    expect(shouldResetChangePasswordForm(true)).toBe(false);
  });
});
