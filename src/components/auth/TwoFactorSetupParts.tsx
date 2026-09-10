"use client";

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { Loader2, Mail, QrCode } from 'lucide-react';
import Image from 'next/image';
import {
  getTwoFactorSetupButtonClassName,
  getTwoFactorVerifyBackStep,
  getTwoFactorVerifyDescription,
  isTwoFactorVerificationCodeComplete,
  sanitizeTwoFactorVerificationCode,
  TWO_FACTOR_CODE_LENGTH,
  type TwoFactorSetupMethod,
  type TwoFactorSetupStep,
} from './two-factor-setup-utils';
import {
  TwoFactorMethodOption,
  TwoFactorSetupError,
} from './TwoFactorSetupSharedParts';

export { TwoFactorSuccessStep } from './TwoFactorSuccessStep';

export function TwoFactorMethodStep({
  error,
  loading,
  onCancel,
  onContinue,
  onMethodChange,
}: {
  error: string | null;
  loading: boolean;
  onCancel?: () => void;
  onContinue: () => void;
  onMethodChange: (method: TwoFactorSetupMethod) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup defaultValue="totp" onValueChange={(value) => onMethodChange(value as TwoFactorSetupMethod)}>
          <TwoFactorMethodOption
            id="totp"
            icon={<QrCode className="mr-3 h-5 w-5 text-muted-foreground" />}
            title="Authenticator App"
            description="Use Google Authenticator, Microsoft Authenticator, etc."
          />
          <TwoFactorMethodOption
            id="email"
            icon={<Mail className="mr-3 h-5 w-5 text-muted-foreground" />}
            title="Email"
            description="Receive verification codes via email."
          />
        </RadioGroup>
        <TwoFactorSetupError error={error} />
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={onContinue} disabled={loading} className={getTwoFactorSetupButtonClassName(!!onCancel)}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
}

export function TwoFactorTotpSetupStep({
  qrCodeUrl,
  secret,
  onBack,
  onNext,
}: {
  qrCodeUrl: string | null;
  secret: string | null;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan QR Code</CardTitle>
        <CardDescription>
          Open your authenticator app and scan the QR code below.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        {qrCodeUrl && (
          <div className="border p-2 rounded-lg bg-white">
            <Image src={qrCodeUrl} alt="2FA QR Code" width={200} height={200} />
          </div>
        )}
        <div className="text-center text-sm">
          <p className="text-muted-foreground mb-1">Unable to scan?</p>
          <code className="bg-muted px-2 py-1 rounded select-all">{secret}</code>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Back</Button>
        <Button onClick={onNext}>Next</Button>
      </CardFooter>
    </Card>
  );
}

export function TwoFactorVerifySetupStep({
  error,
  loading,
  method,
  verificationCode,
  onBackStep,
  onCodeChange,
  onVerify,
}: {
  error: string | null;
  loading: boolean;
  method: TwoFactorSetupMethod;
  verificationCode: string;
  onBackStep: (step: TwoFactorSetupStep) => void;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Code</CardTitle>
        <CardDescription>
          {getTwoFactorVerifyDescription(method)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Label htmlFor="code">Verification Code</Label>
          <Input
            id="code"
            placeholder="123456"
            value={verificationCode}
            onChange={(event) => onCodeChange(sanitizeTwoFactorVerificationCode(event.target.value))}
            className="text-center text-lg tracking-widest"
            maxLength={TWO_FACTOR_CODE_LENGTH}
          />
        </div>
        <TwoFactorSetupError error={error} />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={() => onBackStep(getTwoFactorVerifyBackStep(method))}>Back</Button>
        <Button onClick={onVerify} disabled={loading || !isTwoFactorVerificationCodeComplete(verificationCode)}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify
        </Button>
      </CardFooter>
    </Card>
  );
}
