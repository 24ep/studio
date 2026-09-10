"use client";

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowPathIcon as Loader2,
  FlagIcon as Target,
  LockClosedIcon as Lock,
  ExclamationTriangleIcon as AlertTriangle,
  ArrowTopRightOnSquareIcon as ExternalLink,
} from '@heroicons/react/24/outline';
import type { ApplicantEvaluationLinkInfo } from './applicant-evaluation-modal-api';
import {
  type ApplicantEvaluationPositionValidation,
  canSubmitApplicantEvaluationLinkCreate,
  clampEvaluationExpireDays,
  getApplicantEvaluationLinkActionState,
  getApplicantEvaluationPositionValidationIssues,
  shouldShowApplicantEvaluationPositionWarning,
} from './applicant-evaluation-modal-utils';

interface EvaluationLinkActionsProps {
  linkInfo: ApplicantEvaluationLinkInfo | null;
  linkLoading: boolean;
  expireDays: number;
  requireLogin: boolean;
  canViewLinks: boolean;
  canCreateLink: boolean;
  canManageLink: boolean;
  positionValidation: ApplicantEvaluationPositionValidation;
  onExpireDaysChange: (days: number) => void;
  onRequireLoginChange: (required: boolean) => void;
  onCreateLink: () => void;
  onStartEvaluation: () => void;
  onCopyLink: () => void;
  onRemoveLink: () => void;
  onRecreateLink: () => void;
}

export function EvaluationLinkActions({
  linkInfo,
  linkLoading,
  expireDays,
  requireLogin,
  canViewLinks,
  canCreateLink,
  canManageLink,
  positionValidation,
  onExpireDaysChange,
  onRequireLoginChange,
  onCreateLink,
  onStartEvaluation,
  onCopyLink,
  onRemoveLink,
  onRecreateLink,
}: EvaluationLinkActionsProps) {
  const actionState = getApplicantEvaluationLinkActionState({
    canViewLinks,
    positionValidation,
    hasLink: Boolean(linkInfo),
  });
  const canSubmitCreate = canSubmitApplicantEvaluationLinkCreate({
    linkLoading,
    canCreateLink,
    positionValidation,
  });

  return (
    <div key={linkInfo?.url || 'no-link'} className="flex items-center gap-2">
      <div className="flex items-center gap-2 mr-3">
        <span className="text-sm text-muted-foreground">Expire (days)</span>
        <input
          type="number"
          min={1}
          max={365}
          value={expireDays}
          onChange={(event) => onExpireDaysChange(clampEvaluationExpireDays(event.target.value))}
          className="w-20 border rounded px-2 py-1 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 mr-3 text-sm">
        <input
          type="checkbox"
          checked={requireLogin}
          onChange={(event) => onRequireLoginChange(event.target.checked)}
        />
        <span>Require login</span>
      </label>
      {actionState === 'no-permission' ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          <span>No permission to view evaluation links</span>
        </div>
      ) : actionState === 'loading' ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking configuration...</span>
        </div>
      ) : actionState === 'configuration-required' ? (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <span className="text-sm text-orange-600">Configuration required</span>
        </div>
      ) : actionState === 'create' ? (
        <Button
          disabled={!canSubmitCreate}
          onClick={onCreateLink}
          className="flex items-center gap-2"
        >
          <Target className="h-4 w-4" />
          Create Link
        </Button>
      ) : linkInfo ? (
        <div key={linkInfo.url} className="flex items-center gap-2">
          <Button variant="secondary" disabled={linkLoading} onClick={onStartEvaluation} className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Open
          </Button>
          {canViewLinks && (
            <Button variant="outline" disabled={linkLoading} onClick={onCopyLink}>Copy</Button>
          )}
          {canManageLink && (
            <>
              <Button variant="destructive" disabled={linkLoading} onClick={onRemoveLink}>Remove</Button>
              {canCreateLink && (
                <Button disabled={linkLoading} onClick={onRecreateLink}>Recreate</Button>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function EvaluationLinkMetadata({ linkInfo }: { linkInfo: ApplicantEvaluationLinkInfo }) {
  return (
    <div className="text-sm text-muted-foreground mt-2 space-y-1">
      <div>Expires at: {new Date(linkInfo.expiresAt).toLocaleString()}</div>
      {linkInfo.createdBy && (
        <div>Created by: {linkInfo.createdBy.name || linkInfo.createdBy.email}</div>
      )}
    </div>
  );
}

export function PositionValidationWarning({
  positionValidation,
  hasLink,
  onConfigurePosition,
}: {
  positionValidation: ApplicantEvaluationPositionValidation;
  hasLink: boolean;
  onConfigurePosition: () => void;
}) {
  const shouldShow = shouldShowApplicantEvaluationPositionWarning({
    positionValidation,
    hasLink,
  });

  if (!shouldShow) return null;
  const issues = getApplicantEvaluationPositionValidationIssues(positionValidation);

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">Cannot create evaluation link</p>
          <ul className="text-sm list-disc list-inside space-y-1">
            {issues.map(issue => <li key={issue}>{issue}</li>)}
          </ul>
          <Button
            variant="outline"
            size="sm"
            onClick={onConfigurePosition}
            className="mt-2 flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Configure Position
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
