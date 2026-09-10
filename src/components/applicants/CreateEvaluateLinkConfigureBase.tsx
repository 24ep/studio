"use client";

import { EnvelopeIcon as Mail, ExclamationCircleIcon as AlertCircle } from '@heroicons/react/24/outline';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PositionValidationAlertProps {
  canProceed: boolean;
  positionValidation: {
    hasInterviewers: boolean;
    hasSkills: boolean;
    isLoading: boolean;
    error: string | null;
  };
}

export function PositionValidationAlert({
  canProceed,
  positionValidation,
}: PositionValidationAlertProps) {
  if (positionValidation.isLoading || canProceed) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Cannot create evaluation link</p>
          <ul className="text-sm list-disc list-inside space-y-1">
            {positionValidation.error && <li>{positionValidation.error}</li>}
            {!positionValidation.error && !positionValidation.hasInterviewers && (
              <li>No interviewers assigned to the position</li>
            )}
            {!positionValidation.error && !positionValidation.hasSkills && (
              <li>No evaluation skills assigned</li>
            )}
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface EvaluationLinkSettingsProps {
  expireDays: number;
  onExpireDaysChange: (days: number) => void;
  onRequireLoginChange: (requireLogin: boolean) => void;
  requireLogin: boolean;
}

export function EvaluationLinkSettings({
  expireDays,
  onExpireDaysChange,
  onRequireLoginChange,
  requireLogin,
}: EvaluationLinkSettingsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Expire in (days)</Label>
        <Input
          type="number"
          min={1}
          max={365}
          value={expireDays}
          onChange={(event) => onExpireDaysChange(Math.max(1, Math.min(365, parseInt(event.target.value) || 7)))}
        />
      </div>
      <div className="space-y-2">
        <Label>Require Login</Label>
        <div className="flex items-center h-10">
          <Checkbox
            checked={requireLogin}
            onCheckedChange={(checked) => onRequireLoginChange(Boolean(checked))}
          />
          <span className="ml-2 text-sm text-muted-foreground">Require</span>
        </div>
      </div>
    </div>
  );
}

interface InvitationEmailToggleProps {
  invitationEnabled: boolean;
  onSendEmailChange: (sendEmail: boolean) => void;
  sendEmail: boolean;
}

export function InvitationEmailToggle({
  invitationEnabled,
  onSendEmailChange,
  sendEmail,
}: InvitationEmailToggleProps) {
  if (!invitationEnabled) return null;

  return (
    <div className="flex items-center gap-2 pt-4 border-t">
      <Checkbox
        id="send-email"
        checked={sendEmail}
        onCheckedChange={(checked) => onSendEmailChange(Boolean(checked))}
      />
      <Label htmlFor="send-email" className="flex items-center gap-2 cursor-pointer font-medium">
        <Mail className="h-4 w-4" />
        Send interview invitation email to selected interviewers
      </Label>
    </div>
  );
}
