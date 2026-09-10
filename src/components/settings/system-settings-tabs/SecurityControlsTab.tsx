"use client";

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';

import {
  AccountLockoutAlertsSection,
  SecurityControlsSection,
  SecurityControlSwitchRow,
} from './SecurityControlsTabParts';
import {
  SECURITY_CONTROL_ITEMS,
  type SecurityControlKey,
} from './security-controls-tab-config';
import { SystemSettingsFieldRow } from './SystemSettingsFieldRow';

interface SecurityControlsTabProps {
  screenCaptureProtectionEnabled: boolean;
  setScreenCaptureProtectionEnabled: (val: boolean) => void;
  rightClickProtectionEnabled: boolean;
  setRightClickProtectionEnabled: (val: boolean) => void;
  loginPageDevToolsProtectionEnabled: boolean;
  setLoginPageDevToolsProtectionEnabled: (val: boolean) => void;
  globalTwoFactorEnabled: boolean;
  setGlobalTwoFactorEnabled: (val: boolean) => void;
  passwordSetupLinkExpiryHours: number;
  setPasswordSetupLinkExpiryHours: (val: number) => void;
  faultDetectionDeviceChangeEnabled: boolean;
  setFaultDetectionDeviceChangeEnabled: (val: boolean) => void;
  faultDetectionDeviceChangeThreshold: number;
  setFaultDetectionDeviceChangeThreshold: (val: number) => void;
  faultDetectionDeviceChangeWindowHours: number;
  setFaultDetectionDeviceChangeWindowHours: (val: number) => void;
  faultDetectionLocationSpoofingEnabled: boolean;
  setFaultDetectionLocationSpoofingEnabled: (val: boolean) => void;
  faultDetectionLocationMaxSpeedKmh: number;
  setFaultDetectionLocationMaxSpeedKmh: (val: number) => void;
  faultDetectionLocationMinDistanceKm: number;
  setFaultDetectionLocationMinDistanceKm: (val: number) => void;
  lockoutAlertEmails: string[];
  setLockoutAlertEmails: (val: string[]) => void;
  lockoutWebhookUrl: string;
  setLockoutWebhookUrl: (val: string) => void;
  isSaving: boolean;
}

export default function SecurityControlsTab({
  screenCaptureProtectionEnabled,
  setScreenCaptureProtectionEnabled,
  rightClickProtectionEnabled,
  setRightClickProtectionEnabled,
  loginPageDevToolsProtectionEnabled,
  setLoginPageDevToolsProtectionEnabled,
  globalTwoFactorEnabled,
  setGlobalTwoFactorEnabled,
  passwordSetupLinkExpiryHours,
  setPasswordSetupLinkExpiryHours,
  faultDetectionDeviceChangeEnabled,
  setFaultDetectionDeviceChangeEnabled,
  faultDetectionDeviceChangeThreshold,
  setFaultDetectionDeviceChangeThreshold,
  faultDetectionDeviceChangeWindowHours,
  setFaultDetectionDeviceChangeWindowHours,
  faultDetectionLocationSpoofingEnabled,
  setFaultDetectionLocationSpoofingEnabled,
  faultDetectionLocationMaxSpeedKmh,
  setFaultDetectionLocationMaxSpeedKmh,
  faultDetectionLocationMinDistanceKm,
  setFaultDetectionLocationMinDistanceKm,
  lockoutAlertEmails,
  setLockoutAlertEmails,
  lockoutWebhookUrl,
  setLockoutWebhookUrl,
  isSaving,
}: SecurityControlsTabProps) {
  const values: Record<SecurityControlKey, boolean> = {
    screenCaptureProtectionEnabled,
    rightClickProtectionEnabled,
    loginPageDevToolsProtectionEnabled,
    globalTwoFactorEnabled,
  };
  const setters: Record<SecurityControlKey, (value: boolean) => void> = {
    screenCaptureProtectionEnabled: setScreenCaptureProtectionEnabled,
    rightClickProtectionEnabled: setRightClickProtectionEnabled,
    loginPageDevToolsProtectionEnabled: setLoginPageDevToolsProtectionEnabled,
    globalTwoFactorEnabled: setGlobalTwoFactorEnabled,
  };

  return (
    <ScrollArea className="h-full">
      <SecurityControlsSection>
        {SECURITY_CONTROL_ITEMS.map((item) => (
          <SecurityControlSwitchRow
            key={item.key}
            checked={values[item.key]}
            disabled={isSaving}
            item={item}
            onCheckedChange={setters[item.key]}
          />
        ))}
        <SystemSettingsFieldRow
          htmlFor="password-setup-link-expiry"
          label="Password setup link expiration"
          description="New employee password links expire after this many hours. Existing links keep their original expiration."
        >
          <div className="flex items-center gap-2">
            <Input
              id="password-setup-link-expiry"
              type="number"
              min={1}
              max={720}
              step={1}
              value={passwordSetupLinkExpiryHours}
              onChange={(event) => setPasswordSetupLinkExpiryHours(Math.min(720, Math.max(1, Number(event.target.value) || 1)))}
              disabled={isSaving}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">hours (1–720)</span>
          </div>
        </SystemSettingsFieldRow>
        <SystemSettingsFieldRow
          htmlFor="device-change-fault-enabled"
          label="Cheating detection (repeated device changes)"
          description="Create a cheating fault when a user changes devices repeatedly within the configured period."
        >
          <div className="space-y-4">
            <div className="flex min-h-9 items-center justify-end">
              <Switch id="device-change-fault-enabled" checked={faultDetectionDeviceChangeEnabled} onCheckedChange={setFaultDetectionDeviceChangeEnabled} disabled={isSaving} />
            </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="device-change-threshold">Device changes</Label><Input id="device-change-threshold" type="number" min={2} max={50} value={faultDetectionDeviceChangeThreshold} onChange={event => setFaultDetectionDeviceChangeThreshold(Math.min(50, Math.max(2, Number(event.target.value) || 2)))} disabled={isSaving || !faultDetectionDeviceChangeEnabled} /><p className="text-xs text-muted-foreground">Trigger at this count (2–50).</p></div>
            <div className="space-y-2"><Label htmlFor="device-change-window">Time window (hours)</Label><Input id="device-change-window" type="number" min={1} max={720} value={faultDetectionDeviceChangeWindowHours} onChange={event => setFaultDetectionDeviceChangeWindowHours(Math.min(720, Math.max(1, Number(event.target.value) || 1)))} disabled={isSaving || !faultDetectionDeviceChangeEnabled} /><p className="text-xs text-muted-foreground">Look back from the current scan (1–720 hours).</p></div>
          </div>
          </div>
        </SystemSettingsFieldRow>
        <SystemSettingsFieldRow
          htmlFor="location-spoofing-fault-enabled"
          label="Cheating detection (suspicious location patterns)"
          description="Create a cheating fault for improbable travel between consecutive GPS-backed attendance events for human review."
        >
          <div className="space-y-4">
            <div className="flex min-h-9 items-center justify-end">
              <Switch id="location-spoofing-fault-enabled" checked={faultDetectionLocationSpoofingEnabled} onCheckedChange={setFaultDetectionLocationSpoofingEnabled} disabled={isSaving} />
            </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="location-max-speed">Maximum plausible speed (km/h)</Label><Input id="location-max-speed" type="number" min={50} max={1500} value={faultDetectionLocationMaxSpeedKmh} onChange={event => setFaultDetectionLocationMaxSpeedKmh(Math.min(1500, Math.max(50, Number(event.target.value) || 50)))} disabled={isSaving || !faultDetectionLocationSpoofingEnabled} /></div>
            <div className="space-y-2"><Label htmlFor="location-min-distance">Minimum distance (km)</Label><Input id="location-min-distance" type="number" min={1} max={1000} value={faultDetectionLocationMinDistanceKm} onChange={event => setFaultDetectionLocationMinDistanceKm(Math.min(1000, Math.max(1, Number(event.target.value) || 1)))} disabled={isSaving || !faultDetectionLocationSpoofingEnabled} /></div>
          </div>
            <p className="text-xs text-muted-foreground">Defaults: over 250 km/h across at least 10 km. Findings indicate anomalous evidence, not proven misconduct.</p>
          </div>
        </SystemSettingsFieldRow>
      </SecurityControlsSection>
      <AccountLockoutAlertsSection
        isSaving={isSaving}
        lockoutAlertEmails={lockoutAlertEmails}
        lockoutWebhookUrl={lockoutWebhookUrl}
        setLockoutAlertEmails={setLockoutAlertEmails}
        setLockoutWebhookUrl={setLockoutWebhookUrl}
      />
    </ScrollArea>
  );
}
