"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useClickProtection } from '@/hooks/use-click-protection';
import { signInWithCredentials } from '@/lib/actions/auth';
import {
  GENERIC_LOGIN_FAILED_MESSAGE,
  getCredentialsResultErrorMessage,
  getCredentialsSearchErrorMessage,
  getSafeCredentialsRedirectUrl,
  getTwoFactorRequiredMethod,
  isNextRedirectError,
  UNEXPECTED_LOGIN_ERROR_MESSAGE,
  type TwoFactorMethod,
} from './credentials-signin-form-utils';
import { postAuthJson } from './auth-client-api';

const credentialsSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().optional(),
});

export type CredentialsFormValues = z.infer<typeof credentialsSchema>;
type CredentialsStage = 'email' | 'otp';

interface UseCredentialsSignInFormOptions {
  onStageChange?: (stage: CredentialsStage) => void;
}

export function useCredentialsSignInForm({
  onStageChange,
}: UseCredentialsSignInFormOptions) {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod | undefined>();
  const [credentials, setCredentials] = useState<CredentialsFormValues | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { isActioning, handleProtectedAsyncClick } = useClickProtection({
    actionName: 'sign in',
    debounceMs: 200,
    timeoutMs: 500,
  });

  const form = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    const message = getCredentialsSearchErrorMessage(searchParams?.get('error') ?? null);
    if (message) {
      setError(message);
    }
  }, [searchParams]);

  const submitCredentials = async (data: CredentialsFormValues, twoFactorCode?: string) => {
    await handleProtectedAsyncClick(async () => {
      setIsLoading(true);
      setError(null);
      if (!twoFactorCode) setCredentials(data);

      if (twoFactorCode) {
        window.dispatchEvent(new Event('showSplashScreen'));
      }

      try {
        const formData = new FormData();
        formData.append('email', data.email);
        formData.append('password', data.password || '');
        formData.append('twoFactorCode', twoFactorCode || '');
        formData.append('redirectTo', getSafeCredentialsRedirectUrl(searchParams?.get('callbackUrl') ?? null));

        const result = await signInWithCredentials(formData);

        if (result?.error) {
          if (twoFactorCode) {
            window.dispatchEvent(new Event('hideSplashScreen'));
          }

          const method = getTwoFactorRequiredMethod(result.error);
          if (method) {
            setTwoFactorMethod(method);
            setShow2FA(true);
            return;
          }

          const errorValue = result.error;
          const errorMessage = getCredentialsResultErrorMessage(errorValue);

          if (errorMessage === GENERIC_LOGIN_FAILED_MESSAGE) {
            console.error('Login error:', errorValue);
          }
          setError(errorMessage);
        }
      } catch (e) {
        if (isNextRedirectError(e)) {
          window.location.href = getSafeCredentialsRedirectUrl(searchParams?.get('callbackUrl') ?? null);
          return;
        }

        console.error('Sign in error:', e);
        setError(UNEXPECTED_LOGIN_ERROR_MESSAGE);
        if (twoFactorCode) {
          window.dispatchEvent(new Event('hideSplashScreen'));
        }
      } finally {
        setIsLoading(false);
      }
    });
  };

  const verifyTwoFactorCode = async (code: string) => {
    if (credentials) {
      await submitCredentials(credentials, code);
    }
  };

  const resendTwoFactorCode = async () => {
    if (!credentials) {
      throw new Error('Missing credentials for two-factor resend');
    }

    await postAuthJson('/api/auth/2fa/resend', { email: credentials.email }, 'Failed to resend code');
  };

  useEffect(() => {
    onStageChange?.(show2FA ? 'otp' : 'email');
  }, [show2FA, onStageChange]);

  return {
    clearError: () => setError(null),
    credentials,
    error,
    form,
    isActioning,
    isLoading,
    resendTwoFactorCode,
    searchParams,
    setShow2FA,
    setShowPassword,
    show2FA,
    showPassword,
    submitCredentials,
    twoFactorMethod,
    verifyTwoFactorCode,
  };
}
