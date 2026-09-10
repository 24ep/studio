"use client";

import type React from 'react';

import { ApplicantsPageClientView } from './ApplicantsPageClientView';
import { buildApplicantsPageClientViewProps } from './applicants-page-client-view-props';
import { ApplicantsRecruitmentViewSwitch } from './ApplicantsRecruitmentViewSwitch';
import type { ApplicantsPageClientController } from './hooks/use-applicants-page-client-controller';

interface ApplicantsPageClientResolvedViewProps {
  controller: ApplicantsPageClientController;
  viewSwitcherProps?: React.ComponentProps<typeof ApplicantsRecruitmentViewSwitch>;
}

export function ApplicantsPageClientResolvedView({
  controller,
  viewSwitcherProps,
}: ApplicantsPageClientResolvedViewProps) {
  return (
    <ApplicantsPageClientView
      {...buildApplicantsPageClientViewProps(controller)}
      viewSwitcherProps={viewSwitcherProps}
    />
  );
}
