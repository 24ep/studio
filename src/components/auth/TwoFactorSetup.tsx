"use client";

import {
  TwoFactorMethodStep,
  TwoFactorSuccessStep,
  TwoFactorTotpSetupStep,
  TwoFactorVerifySetupStep,
} from './TwoFactorSetupParts';
import { useTwoFactorSetup } from './use-two-factor-setup';

interface TwoFactorSetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const setup = useTwoFactorSetup({ onComplete });

  if (setup.step === 'method') {
    return (
      <TwoFactorMethodStep
        error={setup.error}
        loading={setup.loading}
        onCancel={onCancel}
        onContinue={setup.initiateSetup}
        onMethodChange={setup.setMethod}
      />
    );
  }

  if (setup.step === 'setup' && setup.method === 'totp') {
    return (
      <TwoFactorTotpSetupStep
        qrCodeUrl={setup.qrCodeUrl}
        secret={setup.secret}
        onBack={() => setup.setStep('method')}
        onNext={() => setup.setStep('verify')}
      />
    );
  }

  if (setup.step === 'verify') {
    return (
      <TwoFactorVerifySetupStep
        error={setup.error}
        loading={setup.loading}
        method={setup.method}
        verificationCode={setup.verificationCode}
        onBackStep={setup.setStep}
        onCodeChange={setup.setVerificationCode}
        onVerify={setup.verifyCode}
      />
    );
  }

  if (setup.step === 'success') {
    return (
      <TwoFactorSuccessStep
        backupCodes={setup.backupCodes}
        onDone={onComplete}
      />
    );
  }

  return null;
}
