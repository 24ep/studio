import {
  PositionEvaluationPanel,
  PositionHeadcountPanel,
  PositionInterviewerPanel,
  PositionMicrosoftAdPanel,
} from './PositionDetailDrawerTabPanels';
import type { PositionDetailDrawerContentProps } from './PositionDetailDrawerContentTypes';

export function PositionHeadcountPanelBranch({
  filteredApplicants,
  isEditMode,
  isMobile,
  onCustomFieldChange,
  onHeadcountChange,
  position,
  positionId,
}: PositionDetailDrawerContentProps) {
  return (
    <PositionHeadcountPanel
      isMobile={isMobile}
      isEditMode={isEditMode}
      position={position}
      positionId={positionId}
      filteredApplicants={filteredApplicants}
      onHeadcountChange={onHeadcountChange}
      onCustomFieldChange={onCustomFieldChange}
    />
  );
}

export function PositionInterviewerPanelBranch({
  isMobile,
  position,
  positionId,
}: PositionDetailDrawerContentProps) {
  return <PositionInterviewerPanel isMobile={isMobile} position={position} positionId={positionId} />;
}

export function PositionEvaluationPanelBranch({
  position,
  positionId,
}: PositionDetailDrawerContentProps) {
  return <PositionEvaluationPanel position={position} positionId={positionId} />;
}

export function PositionMicrosoftAdPanelBranch({
  adUsers,
  adUsersError,
  isLoadingAdUsers,
  isMobile,
  onRetryAdUsers,
  position,
}: PositionDetailDrawerContentProps) {
  return (
    <PositionMicrosoftAdPanel
      isMobile={isMobile}
      position={position}
      adUsers={adUsers}
      isLoadingAdUsers={isLoadingAdUsers}
      adUsersError={adUsersError}
      onRetryAdUsers={onRetryAdUsers}
    />
  );
}
