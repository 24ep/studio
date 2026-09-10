"use client";

import type React from 'react';
import { CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { EmailServerTabProps } from './email-server-tab-types';
import { EmailTextField, SwitchRow } from './EmailServerFieldPrimitives';
import type { EmailProvider } from '@/features/settings/system-settings-types';

type EmailServerFieldsProps = Omit<
  EmailServerTabProps,
  'emailServiceEnabled' | 'setEmailServiceEnabled' | 'setTestingEmail'
> & {
  onTestConnection: () => void;
  targetEmail: string;
  setTargetEmail: (value: string) => void;
};

const EMAIL_PROVIDER_OPTIONS: Array<{
  value: EmailProvider;
  label: string;
}> = [
  { value: 'smtp', label: 'SMTP (Gmail, Microsoft 365, Amazon SES, custom)' },
  { value: 'resend', label: 'Resend API' },
  { value: 'mailersend', label: 'MailerSend API' },
  { value: 'brevo', label: 'Brevo API' },
  { value: 'sendgrid', label: 'SendGrid API' },
  { value: 'mailgun', label: 'Mailgun API' },
  { value: 'postmark', label: 'Postmark API' },
];

export function EmailServerFields(props: EmailServerFieldsProps): React.ReactElement {
  const {
    emailSmtpHost,
    setEmailSmtpHost,
    emailSmtpPort,
    setEmailSmtpPort,
    emailSmtpSecure,
    setEmailSmtpSecure,
    emailSmtpUser,
    setEmailSmtpUser,
    emailSmtpPassword,
    setEmailSmtpPassword,
    emailFromAddress,
    setEmailFromAddress,
    emailFromName,
    setEmailFromName,
    showSmtpPassword,
    setShowSmtpPassword,
    isSaving,
    emailProvider,
    setEmailProvider,
    emailApiKey,
    setEmailApiKey,
    emailMailgunDomain,
    setEmailMailgunDomain,
  } = props;

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email-provider">Email Provider</Label>
        <Select
          value={emailProvider}
          onValueChange={(value) => setEmailProvider(value as EmailProvider)}
          disabled={isSaving}
        >
          <SelectTrigger id="email-provider" className="h-10 bg-background px-3 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EMAIL_PROVIDER_OPTIONS.map((provider) => (
              <SelectItem key={provider.value} value={provider.value}>
                <span className="flex items-center gap-2.5">
                  <EmailProviderLogo provider={provider.value} />
                  <span>{provider.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Use SMTP for any provider not listed, including Gmail, Microsoft 365, Amazon SES, and custom mail servers.
        </p>
      </div>
      {emailProvider === 'smtp' ? (
        <>
      <EmailTextField
        id="email-smtp-host"
        label="SMTP Host"
        placeholder="smtp.gmail.com"
        value={emailSmtpHost}
        onChange={setEmailSmtpHost}
        disabled={isSaving}
        description="SMTP server hostname (e.g., smtp.gmail.com, smtp.office365.com)"
      />
      <SmtpPortField
        emailSmtpPort={emailSmtpPort}
        setEmailSmtpPort={setEmailSmtpPort}
        isSaving={isSaving}
      />
      <SwitchRow
        id="email-smtp-secure"
        label="Use Secure Connection (TLS/SSL)"
        description="Enable for TLS/SSL encrypted connections (recommended)"
        checked={emailSmtpSecure}
        onCheckedChange={setEmailSmtpSecure}
        disabled={isSaving}
      />
      <EmailTextField
        id="email-smtp-user"
        label="SMTP Username"
        placeholder="your-email@example.com"
        value={emailSmtpUser}
        onChange={setEmailSmtpUser}
        disabled={isSaving}
        description="Username for SMTP authentication (usually your email address)"
      />
      <SmtpPasswordField
        emailSmtpPassword={emailSmtpPassword}
        setEmailSmtpPassword={setEmailSmtpPassword}
        showSmtpPassword={showSmtpPassword}
        setShowSmtpPassword={setShowSmtpPassword}
        isSaving={isSaving}
      />
        </>
      ) : (
        <>
          <ApiKeyField
            emailApiKey={emailApiKey}
            setEmailApiKey={setEmailApiKey}
            showSmtpPassword={showSmtpPassword}
            setShowSmtpPassword={setShowSmtpPassword}
            isSaving={isSaving}
            provider={emailProvider}
          />
          {emailProvider === 'mailgun' && (
            <EmailTextField
              id="email-mailgun-domain"
              label="Mailgun Sending Domain"
              placeholder="mg.example.com"
              value={emailMailgunDomain}
              onChange={setEmailMailgunDomain}
              disabled={isSaving}
              description="The verified domain configured in Mailgun"
            />
          )}
        </>
      )}
      <EmailTextField
        id="email-from-address"
        label="From Email Address"
        type="email"
        placeholder="noreply@example.com"
        value={emailFromAddress}
        onChange={setEmailFromAddress}
        disabled={isSaving}
        description="Email address that will appear as the sender"
      />
      <EmailTextField
        id="email-from-name"
        label="From Name"
        placeholder="Recruitment System"
        value={emailFromName}
        onChange={setEmailFromName}
        disabled={isSaving}
        description="Display name for the sender (optional)"
      />
      <EmailTextField
        id="email-test-recipient"
        label="Test Email Recipient"
        type="email"
        placeholder="you@example.com"
        value={props.targetEmail}
        onChange={props.setTargetEmail}
        disabled={isSaving || props.testingEmail}
        description="A real message will be delivered to this address when you test the configuration"
      />
      <TestConnectionButton {...props} />
    </>
  );
}

function EmailProviderLogo({ provider }: { provider: EmailProvider }): React.ReactElement {
  const commonProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    role: 'img',
    'aria-label': `${provider} logo`,
    className: 'h-5 w-5 shrink-0',
  };

  switch (provider) {
    case 'resend':
      return (
        <svg {...commonProps}>
          <rect width="24" height="24" rx="5" fill="#000" />
          <path fill="#fff" d="M6 5.5h7.1c3.2 0 5.4 1.9 5.4 4.8 0 2-1.1 3.6-2.8 4.3l3.2 3.9h-4.1l-2.7-3.4H9.5v3.4H6v-13Zm3.5 3v3.7h3.3c1.3 0 2.1-.7 2.1-1.9s-.8-1.8-2.1-1.8H9.5Z" />
        </svg>
      );
    case 'mailersend':
      return (
        <svg {...commonProps}>
          <rect width="24" height="24" rx="5" fill="#5D5FEF" />
          <path fill="#fff" d="m4.5 7.2 7.5 4.6 7.5-4.6v9.6a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V7.2Zm1.2-2h12.6c.5 0 .9.2 1.2.6L12 10.4 4.5 5.8c.3-.4.7-.6 1.2-.6Z" />
        </svg>
      );
    case 'brevo':
      return (
        <svg {...commonProps}>
          <rect width="24" height="24" rx="5" fill="#0B996E" />
          <path fill="#fff" d="M6 5h6.5c3.2 0 5 1.3 5 3.7 0 1.5-.8 2.6-2.1 3.2 1.7.5 2.6 1.7 2.6 3.4 0 2.5-2 3.7-5.3 3.7H6V5Zm3.4 2.8v2.8h2.8c1.2 0 1.9-.5 1.9-1.4 0-.9-.7-1.4-1.9-1.4H9.4Zm0 5.4v3h3.1c1.3 0 2-.5 2-1.5s-.7-1.5-2-1.5H9.4Z" />
        </svg>
      );
    case 'sendgrid':
      return (
        <svg {...commonProps}>
          <rect width="24" height="24" rx="5" fill="#1A82E2" />
          <g fill="#fff">
            <path d="M5 5h6v6H5zM13 5h6v6h-6zM5 13h6v6H5z" opacity=".95" />
            <path d="M13 13h6v6h-6z" opacity=".65" />
          </g>
        </svg>
      );
    case 'mailgun':
      return (
        <svg {...commonProps}>
          <rect width="24" height="24" rx="5" fill="#E53935" />
          <path fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M18.2 15.8A8 8 0 1 1 20 10.7v2.1a2.2 2.2 0 0 1-4.4 0V8.4m0 4.1a3.6 3.6 0 1 1 0-1.6" />
        </svg>
      );
    case 'postmark':
      return (
        <svg {...commonProps}>
          <rect width="24" height="24" rx="5" fill="#FFDE00" />
          <path fill="#2D2D2D" d="M5 6h14v12H5V6Zm2 2v1l5 3.5L17 9V8H7Zm10 8v-4.6l-5 3.4-5-3.4V16h10Z" />
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <rect width="24" height="24" rx="5" fill="#475569" />
          <path fill="#fff" d="M5 7h14v10H5V7Zm2 2v.6l5 3.2 5-3.2V9H7Zm10 6v-3l-5 3.1L7 12v3h10Z" />
        </svg>
      );
  }
}

function ApiKeyField({
  emailApiKey,
  setEmailApiKey,
  showSmtpPassword,
  setShowSmtpPassword,
  isSaving,
  provider,
}: Pick<EmailServerFieldsProps, 'emailApiKey' | 'setEmailApiKey' | 'showSmtpPassword' | 'setShowSmtpPassword' | 'isSaving'>
  & { provider: EmailProvider }): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label htmlFor="email-api-key">{provider === 'postmark' ? 'Server Token' : 'API Key'}</Label>
      <div className="relative">
        <Input
          id="email-api-key"
          type={showSmtpPassword ? 'text' : 'password'}
          placeholder={provider === 'postmark' ? 'Postmark server token' : `${provider} API key`}
          value={emailApiKey}
          onChange={(event) => setEmailApiKey(event.target.value)}
          disabled={isSaving}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
          disabled={isSaving}
          aria-label={showSmtpPassword ? 'Hide API key' : 'Show API key'}
        >
          {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Masked when displayed after saving.</p>
    </div>
  );
}

function SmtpPortField({
  emailSmtpPort,
  setEmailSmtpPort,
  isSaving,
}: Pick<EmailServerFieldsProps, 'emailSmtpPort' | 'setEmailSmtpPort' | 'isSaving'>): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label htmlFor="email-smtp-port">SMTP Port</Label>
      <Input
        id="email-smtp-port"
        type="number"
        min="1"
        max="65535"
        placeholder="587"
        value={emailSmtpPort}
        onChange={(event) => setEmailSmtpPort(parseInt(event.target.value) || 587)}
        disabled={isSaving}
      />
      <p className="text-xs text-muted-foreground">
        SMTP server port (587 for TLS, 465 for SSL, 25 for unencrypted)
      </p>
    </div>
  );
}

function SmtpPasswordField({
  emailSmtpPassword,
  setEmailSmtpPassword,
  showSmtpPassword,
  setShowSmtpPassword,
  isSaving,
}: Pick<
  EmailServerFieldsProps,
  'emailSmtpPassword' | 'setEmailSmtpPassword' | 'showSmtpPassword' | 'setShowSmtpPassword' | 'isSaving'
>): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label htmlFor="email-smtp-password">SMTP Password</Label>
      <div className="relative">
        <Input
          id="email-smtp-password"
          type={showSmtpPassword ? 'text' : 'password'}
          placeholder="your-password"
          value={emailSmtpPassword}
          onChange={(event) => setEmailSmtpPassword(event.target.value)}
          disabled={isSaving}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
          disabled={isSaving}
        >
          {showSmtpPassword ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Password or app-specific password for SMTP authentication
      </p>
    </div>
  );
}

function TestConnectionButton({
  isSaving,
  testingEmail,
  emailSmtpHost,
  emailSmtpUser,
  emailProvider,
  emailApiKey,
  emailMailgunDomain,
  emailFromAddress,
  targetEmail,
  onTestConnection,
}: Pick<
  EmailServerFieldsProps,
  'isSaving' | 'testingEmail' | 'emailSmtpHost' | 'emailSmtpUser' | 'emailProvider' | 'emailApiKey' | 'emailMailgunDomain' | 'emailFromAddress' | 'targetEmail' | 'onTestConnection'
>): React.ReactElement {
  const providerReady = emailProvider === 'smtp'
    ? Boolean(emailSmtpHost && emailSmtpUser)
    : Boolean(emailApiKey && (emailProvider !== 'mailgun' || emailMailgunDomain));
  return (
    <div className="flex items-center gap-2 pt-2">
      <Button
        type="button"
        variant="outline"
        onClick={onTestConnection}
        disabled={isSaving || testingEmail || !providerReady || !emailFromAddress || !targetEmail}
      >
        {testingEmail ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Send Test Email
          </>
        )}
      </Button>
    </div>
  );
}
