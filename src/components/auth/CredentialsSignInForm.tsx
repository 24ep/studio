"use client";

import { TwoFactorVerify } from './TwoFactorVerify';
import { CredentialsPasswordForm } from './CredentialsSignInFormParts';
import { useCredentialsSignInForm } from './use-credentials-signin-form';

export function CredentialsSignInForm({
  activeFontColor,
  activeBgStart,
  activeBgEnd,
  submitButtonClassName,
  onStageChange
}: {
  activeFontColor?: string,
  activeBgStart?: string,
  activeBgEnd?: string,
  submitButtonClassName?: string,
  onStageChange?: (stage: 'email' | 'otp') => void
}) {
  const signInForm = useCredentialsSignInForm({ onStageChange });

  if (signInForm.show2FA && signInForm.credentials) {
    return (
      <TwoFactorVerify
        email={signInForm.credentials.email}
        method={signInForm.twoFactorMethod}
        onVerify={signInForm.verifyTwoFactorCode}
        onCancel={() => { signInForm.setShow2FA(false); }}
        onResend={signInForm.twoFactorMethod === 'email' ? signInForm.resendTwoFactorCode : undefined}
        error={signInForm.error}
        isLoading={signInForm.isLoading}
      />
    );
  }

  return (
    <CredentialsPasswordForm
      activeBgEnd={activeBgEnd}
      activeBgStart={activeBgStart}
      activeFontColor={activeFontColor}
      clearError={signInForm.clearError}
      error={signInForm.error}
      form={signInForm.form}
      isActioning={signInForm.isActioning}
      isLoading={signInForm.isLoading}
      shouldShowInlineError={!signInForm.searchParams?.get('error')}
      showPassword={signInForm.showPassword}
      submitButtonClassName={submitButtonClassName}
      submitCredentials={signInForm.submitCredentials}
      togglePasswordVisibility={() => signInForm.setShowPassword((prev) => !prev)}
    />
  );
}
