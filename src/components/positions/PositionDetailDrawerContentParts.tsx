import { PositionApplicantsPanelBranch } from './PositionDetailDrawerApplicantsPanel';
import {
  PositionEvaluationPanelBranch,
  PositionHeadcountPanelBranch,
  PositionInterviewerPanelBranch,
  PositionMicrosoftAdPanelBranch,
} from './PositionDetailDrawerAuxiliaryPanels';
import type { PositionDetailDrawerContentProps } from './PositionDetailDrawerContentTypes';
import {
  PositionCriteriaPanel,
  PositionDetailsPanel,
  PositionJobDescriptionPanel,
} from './PositionDetailDrawerPrimaryPanels';

export function PositionDetailDrawerActivePanel(props: PositionDetailDrawerContentProps) {
  const { activeTab, position } = props;

  if (activeTab === 'details' && position) {
    return <PositionDetailsPanel {...props} />;
  }

  if (activeTab === 'job-description' && position) {
    return <PositionJobDescriptionPanel {...props} />;
  }

  if (activeTab === 'criteria' && position) {
    return <PositionCriteriaPanel {...props} />;
  }

  if (activeTab === 'Applicants') {
    return <PositionApplicantsPanelBranch {...props} />;
  }

  if (activeTab === 'headcount') {
    return <PositionHeadcountPanelBranch {...props} />;
  }

  if (activeTab === 'hiring-managers') {
    return <PositionInterviewerPanelBranch {...props} />;
  }

  if (activeTab === 'evaluation') {
    return <PositionEvaluationPanelBranch {...props} />;
  }

  if (activeTab === 'existing-employees') {
    return <PositionMicrosoftAdPanelBranch {...props} />;
  }

  return null;
}
