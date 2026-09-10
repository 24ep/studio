import type { EmailProvider } from '@/features/settings/system-settings-types';

export interface EmailServerTabProps {
  emailServiceEnabled: boolean;
  setEmailServiceEnabled: (val: boolean) => void;
  emailProvider: EmailProvider;
  setEmailProvider: (val: EmailProvider) => void;
  emailApiKey: string;
  setEmailApiKey: (val: string) => void;
  emailMailgunDomain: string;
  setEmailMailgunDomain: (val: string) => void;
  emailSmtpHost: string;
  setEmailSmtpHost: (val: string) => void;
  emailSmtpPort: number;
  setEmailSmtpPort: (val: number) => void;
  emailSmtpSecure: boolean;
  setEmailSmtpSecure: (val: boolean) => void;
  emailSmtpUser: string;
  setEmailSmtpUser: (val: string) => void;
  emailSmtpPassword: string;
  setEmailSmtpPassword: (val: string) => void;
  emailFromAddress: string;
  setEmailFromAddress: (val: string) => void;
  emailFromName: string;
  setEmailFromName: (val: string) => void;
  showSmtpPassword: boolean;
  setShowSmtpPassword: (val: boolean) => void;
  isSaving: boolean;
  testingEmail: boolean;
  setTestingEmail: (val: boolean) => void;
}

export interface EmailConnectionSettings {
  provider?: EmailProvider;
  apiKey?: string;
  mailgunDomain?: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromAddress: string;
  fromName: string;
  targetEmail: string;
}

export interface TestEmailResponse {
  success?: boolean;
  error?: string;
}
