"use client";

import { BellRing, Link, MailWarning, ShieldAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { EmailChipInput } from '@/components/ui/email-chip-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import type { SecurityControlItem } from './security-controls-tab-config';
import { SystemSettingsFieldRow } from './SystemSettingsFieldRow';

export function SecurityControlsSection({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <section className="border-b px-6 py-5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold">Security Controls</h2>
          <p className="text-xs font-normal text-muted-foreground">
            Configure application security and content protection settings
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {children}
      </div>
    </section>
  );
}

export function SecurityControlSwitchRow({
  checked,
  disabled,
  item,
  onCheckedChange,
}: {
  checked: boolean;
  disabled: boolean;
  item: SecurityControlItem;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <SystemSettingsFieldRow htmlFor={item.id} label={item.label} description={item.description}>
      <div className="flex min-h-9 items-center justify-end gap-4">
        {item.note && (
          <p className="max-w-md text-right text-xs italic text-muted-foreground">{item.note}</p>
        )}
        <Switch
          id={item.id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </SystemSettingsFieldRow>
  );
}

export function AccountLockoutAlertsSection({
  isSaving,
  lockoutAlertEmails,
  lockoutWebhookUrl,
  setLockoutAlertEmails,
  setLockoutWebhookUrl,
}: {
  isSaving: boolean;
  lockoutAlertEmails: string[];
  lockoutWebhookUrl: string;
  setLockoutAlertEmails: (value: string[]) => void;
  setLockoutWebhookUrl: (value: string) => void;
}) {
  return (
    <section className="border-b px-6 py-5">
      <div className="flex items-center gap-2">
        <BellRing className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-semibold">Account Lockout Alerts</h2>
          <p className="text-xs font-normal text-muted-foreground">
            Configure administrator notifications for locked user accounts
          </p>
        </div>
      </div>
      <div className="mt-5 space-y-6">
        <SystemSettingsFieldRow
          label={<Label className="flex items-center gap-2">
            <MailWarning className="h-4 w-4 text-muted-foreground" />
            Alert Emails
          </Label>}
          description="Administrators will be notified at these addresses when a user account is locked."
        >
          <div className="space-y-2">
            <EmailChipInput
              value={lockoutAlertEmails}
              onChange={setLockoutAlertEmails}
              placeholder="Add administrator email..."
            />
            <p className="text-xs italic text-muted-foreground">
              Type an email and press Enter, comma, or space to add.
            </p>
          </div>
        </SystemSettingsFieldRow>

        <SystemSettingsFieldRow
          htmlFor="lockout-webhook-url"
          label={<Label htmlFor="lockout-webhook-url" className="flex items-center gap-2">
            <Link className="h-4 w-4 text-muted-foreground" />
            Alert Webhook URL (Optional)
          </Label>}
          description="Send a POST request to this URL when a lockout occurs."
        >
          <Input
            id="lockout-webhook-url"
            value={lockoutWebhookUrl}
            onChange={(event) => setLockoutWebhookUrl(event.target.value)}
            placeholder="https://your-server.com/api/webhooks/lockout"
            className="font-mono text-sm"
            disabled={isSaving}
          />
        </SystemSettingsFieldRow>
      </div>
    </section>
  );
}
