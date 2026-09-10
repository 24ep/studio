export type SecurityControlKey =
  | 'screenCaptureProtectionEnabled'
  | 'rightClickProtectionEnabled'
  | 'loginPageDevToolsProtectionEnabled'
  | 'globalTwoFactorEnabled';

export interface SecurityControlItem {
  key: SecurityControlKey;
  id: string;
  label: string;
  description: string;
  note?: string;
}

export const SECURITY_CONTROL_ITEMS: SecurityControlItem[] = [
  {
    key: 'screenCaptureProtectionEnabled',
    id: 'screen-capture-protection',
    label: 'Screen Capture Protection',
    description: 'Enable watermark overlay and screenshot attempt logging.',
    note: 'Note: Browser-based protection is limited. This adds a visual watermark and logs "PrintScreen" key events.',
  },
  {
    key: 'rightClickProtectionEnabled',
    id: 'right-click-protection',
    label: 'Right Click Protection',
    description: 'Disable right-click context menu to prevent content copying.',
  },
  {
    key: 'loginPageDevToolsProtectionEnabled',
    id: 'login-devtools-protection',
    label: 'Login Page Protection',
    description: 'Disable right-click and DevTools shortcuts (F12, Ctrl+Shift+I) on the sign-in page.',
  },
  {
    key: 'globalTwoFactorEnabled',
    id: 'global-2fa',
    label: 'Global Two-Factor Authentication',
    description: 'Enforce 2FA for all users. Fallback to Email OTP if no method is configured.',
  },
];
