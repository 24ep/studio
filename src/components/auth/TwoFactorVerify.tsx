
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardTitle, CardDescription } from '@/components/ui/card';

import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, ShieldCheck } from 'lucide-react';
import {
  TWO_FACTOR_OTP_SLOT_CLASS_NAME,
  TWO_FACTOR_RESEND_SUCCESS_TIMEOUT_MS,
  TWO_FACTOR_VERIFY_CODE_LENGTH,
  canSubmitTwoFactorVerifyCode,
  getTwoFactorOtpSlotIndexes,
  getTwoFactorVerifyCancelLabel,
  getTwoFactorVerifyPrompt,
  getTwoFactorVerifyResendButtonLabel,
  isTwoFactorVerifyEmailMethod,
  isTwoFactorVerifySubmitDisabled,
  shouldRunTwoFactorVerifyResend,
  type TwoFactorVerifyMethod,
} from './two-factor-verify-utils';


interface TwoFactorVerifyProps {
  email: string; // Used for context/resending email if needed
  method?: TwoFactorVerifyMethod; // Method determines UI messaging
  onVerify: (code: string) => Promise<void>;
  onCancel?: () => void;
  onResend?: () => Promise<void>; // Optional callback to resend email OTP
  error?: string | null;
  isLoading?: boolean;
}

export function TwoFactorVerify({ email, method, onVerify, onCancel, onResend, error, isLoading }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmitTwoFactorVerifyCode(code)) {
      await onVerify(code);
    }
  };

  const handleResend = async () => {
    if (!shouldRunTwoFactorVerifyResend(onResend, isResending)) return;
    setIsResending(true);
    setResendSuccess(false);
    try {
      await onResend();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), TWO_FACTOR_RESEND_SUCCESS_TIMEOUT_MS);
    } catch (e) {
      console.error('Failed to resend code:', e);
    } finally {
      setIsResending(false);
    }
  };

  const isEmailMethod = isTwoFactorVerifyEmailMethod(method);
  const prompt = getTwoFactorVerifyPrompt({ email, method });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform hover:scale-105">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl font-bold">Verify identity</CardTitle>
        <CardDescription className="text-sm">
          {prompt.lead}
          <span className="font-medium text-foreground">{prompt.emphasis}</span>
          {prompt.tail}
        </CardDescription>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="relative group">
            <Label htmlFor="2fa-code" className="sr-only">Verification Code</Label>
            <div className="flex justify-center my-6">
              <InputOTP
                maxLength={TWO_FACTOR_VERIFY_CODE_LENGTH}
                value={code}
                onChange={(value) => setCode(value)}
                disabled={isLoading}
                autoFocus
                containerClassName="gap-3"
              >
                <InputOTPGroup className="gap-3">
                  {getTwoFactorOtpSlotIndexes().map(index => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className={TWO_FACTOR_OTP_SLOT_CLASS_NAME}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertTitle className="flex items-center">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Invalid Code
              </AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-4">
          <Button
            type="submit"
            className="w-full h-10 text-sm font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
            disabled={isTwoFactorVerifySubmitDisabled(isLoading, code)}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              'Verify & Continue'
            )}
          </Button>

          <div className="flex flex-col items-center space-y-2">
            {/* Only show resend option for email method */}
            {isEmailMethod && (
              <p className="text-sm text-muted-foreground">
                {resendSuccess ? (
                  <span className="text-green-600 font-medium">Code sent! Check your email.</span>
                ) : (
                  <>
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      className="text-primary hover:underline font-medium disabled:opacity-50"
                      onClick={handleResend}
                      disabled={isResending || !onResend}
                    >
                      {getTwoFactorVerifyResendButtonLabel(isResending)}
                    </button>
                  </>
                )}
              </p>
            )}
            {onCancel && (
              <Button type="button" variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={onCancel}>
                {getTwoFactorVerifyCancelLabel(isEmailMethod)}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
