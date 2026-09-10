"use client";

import { useState } from 'react';
import {
  getTwoFactorSetupErrorMessage,
  getTwoFactorSetupNextStep,
  normalizeTwoFactorBackupCodes,
  type TwoFactorSetupMethod,
  type TwoFactorSetupStep,
} from './two-factor-setup-utils';
import {
  requestTwoFactorSetup,
  requestTwoFactorVerification,
} from './two-factor-setup-api';

export function useTwoFactorSetup({ onComplete }: { onComplete?: () => void }) {
  const [method, setMethod] = useState<TwoFactorSetupMethod>('totp');
  const [step, setStep] = useState<TwoFactorSetupStep>('method');
  const [loading, setLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  const initiateSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestTwoFactorSetup(method);

      if (method === 'totp') {
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      }
      setStep(getTwoFactorSetupNextStep(method));
    } catch (err: unknown) {
      setError(getTwoFactorSetupErrorMessage(err, 'Setup failed'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestTwoFactorVerification(verificationCode);

      setBackupCodes(normalizeTwoFactorBackupCodes(data.backupCodes));
      setStep('success');
      onComplete?.();
    } catch (err: unknown) {
      setError(getTwoFactorSetupErrorMessage(err, 'Verification failed'));
    } finally {
      setLoading(false);
    }
  };

  return {
    backupCodes,
    error,
    loading,
    method,
    qrCodeUrl,
    secret,
    step,
    verificationCode,
    initiateSetup,
    setMethod,
    setStep,
    setVerificationCode,
    verifyCode,
  };
}
