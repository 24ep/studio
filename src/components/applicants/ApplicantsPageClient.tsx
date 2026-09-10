"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ApplicantsPageClientResolvedView } from './ApplicantsPageClientResolvedView';
import { ApplicantsPageLoadingState } from './ApplicantsPageLoadingState';
import { ApplicantsPageModals } from './ApplicantsPageModals';
import type { ApplicantsPageClientProps } from './ApplicantsPageClientTypes';
import { ApplicantsRecruitmentViewSwitch, type ApplicantsRecruitmentView } from './ApplicantsRecruitmentViewSwitch';
import { ApplicantsHeaderUploadButton } from './ApplicantsPageHeaderActionsMenu';
import { buildApplicantsPageClientViewProps } from './applicants-page-client-view-props';
import { useApplicantsPageClientController } from './hooks/use-applicants-page-client-controller';
import { MyTasksPageClient } from '@/components/tasks/MyTasksPageClient';

export function ApplicantsPageClient(props: ApplicantsPageClientProps) {
  const controller = useApplicantsPageClientController(props);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewFromUrl = searchParams.get('view') === 'task-board' ? 'task-board' : 'applicants';
  const [activeView, setActiveView] = useState<ApplicantsRecruitmentView>(viewFromUrl);
  const selectedApplicantId = searchParams.get('applicantId');

  useEffect(() => {
    setActiveView(viewFromUrl);
  }, [viewFromUrl]);

  useEffect(() => {
    if (selectedApplicantId) {
      router.replace(`/applicants/${selectedApplicantId}`);
    }
  }, [router, selectedApplicantId]);

  if (controller.sessionGateMessage) {
    return <ApplicantsPageLoadingState message={controller.sessionGateMessage} />;
  }

  const applicantViewProps = buildApplicantsPageClientViewProps(controller);

  const handleViewChange = (view: ApplicantsRecruitmentView) => {
    if (view === activeView) {
      return;
    }

    const nextParams = new URLSearchParams(window.location.search);

    if (view === 'task-board') {
      nextParams.set('view', 'task-board');
    } else {
      nextParams.delete('view');
    }

    const queryString = nextParams.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

    setActiveView(view);
    window.history.replaceState(window.history.state, '', nextUrl);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="min-h-0 flex-1">
        {activeView === 'task-board' ? (
          <div className="h-full min-h-0">
            <MyTasksPageClient
              embedded
              userSession={props.userSession ?? null}
              headerLeading={(
              <ApplicantsRecruitmentViewSwitch
                activeView={activeView}
                onViewChange={handleViewChange}
              />
              )}
              headerTrailing={(
                <ApplicantsHeaderUploadButton
                  disabled={
                    applicantViewProps.headerProps.isLoading ||
                    applicantViewProps.headerProps.tableLoading
                  }
                  onBulkUpload={applicantViewProps.headerProps.onBulkUpload}
                />
              )}
            />
            <ApplicantsPageModals {...applicantViewProps.modalsProps} />
          </div>
        ) : (
          <ApplicantsPageClientResolvedView
            controller={controller}
            viewSwitcherProps={{
              activeView,
              onViewChange: handleViewChange,
            }}
          />
        )}
      </div>
    </div>
  );
}
