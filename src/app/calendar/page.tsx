
'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { CreateEvaluateLinkModal } from '@/components/applicants/CreateEvaluateLinkModal';
import ApplicantDetailModal from '@/components/applicants/ApplicantDetailModal';
import { CalendarCreateLinkDialog } from './CalendarCreateLinkDialog';
import {
  CalendarMobileCreateButton,
  CalendarPageErrorState,
  CalendarPageLoadingState,
  CalendarPageMainContent,
  CalendarQrCodeDialog,
} from './CalendarPageParts';
import { useCalendarCreateLinkController } from './use-calendar-create-link-controller';
import { useCalendarPageData } from './use-calendar-page-data';

function EvaluatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const isMobile = useIsMobile();
  const { status: sessionStatus } = useSession();
  const {
    applicants,
    appLogoUrl,
    error,
    fetchApplicantsWithEvaluationLinks,
    isLoading,
    reminders,
    scheduleApplicantInterview,
  } = useCalendarPageData({ sessionStatus, query });

  // Calendar view state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [detailApplicantId, setDetailApplicantId] = useState<string | null>(null);

  const {
    createDialogState,
    editEvaluationLinkState,
    qrDialogState,
    selectedApplicant,
    showCreateLinkModal,
    setShowCreateLinkModal,
    setSelectedApplicant,
    handleOpenCreateModal,
  } = useCalendarCreateLinkController({
    applicants,
    refreshApplicantsWithEvaluationLinks: fetchApplicantsWithEvaluationLinks,
    pushRoute: router.push,
  });

  const handleCalendarApplicantClick = (applicantId: string) => {
    setDetailApplicantId(applicantId);
  };

  const closeApplicantDetail = () => {
    setDetailApplicantId(null);
  };

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (sessionStatus === 'loading') {
      // Still loading session, wait
      return;
    }

    if (sessionStatus === 'unauthenticated') {
      // User is not authenticated, redirect to login with callback URL
      const currentPath = '/calendar';
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [sessionStatus, router]);

  // Show loading screen when checking authentication or loading data
  if (sessionStatus === 'loading' || isLoading) {
    return <CalendarPageLoadingState />;
  }

  // If not authenticated, the useEffect will handle redirect
  // This prevents flash of content before redirect
  if (sessionStatus === 'unauthenticated') {
    return <CalendarPageLoadingState />;
  }

  if (error) {
    return (
      <CalendarPageErrorState
        error={error}
        isMobile={isMobile}
        onRetry={fetchApplicantsWithEvaluationLinks}
      />
    );
  }

  return (
    <>
      <CalendarPageMainContent
        applicants={applicants}
        isMobile={isMobile}
        reminders={reminders}
        selectedDate={selectedDate}
        onApplicantClick={handleCalendarApplicantClick}
        onCreateLink={handleOpenCreateModal}
        onDateSelect={setSelectedDate}
        onScheduleApplicant={scheduleApplicantInterview}
      />

      {detailApplicantId && (
        <ApplicantDetailModal
          applicantId={detailApplicantId}
          open={true}
          onClose={closeApplicantDetail}
          onRefresh={fetchApplicantsWithEvaluationLinks}
        />
      )}

      <CalendarCreateLinkDialog
        {...createDialogState}
        isMobile={isMobile}
      />

      {/* Create Evaluate Link Modal - Using new unified component */}
      {selectedApplicant && (
        <CreateEvaluateLinkModal
          isOpen={showCreateLinkModal}
          onOpenChange={(open) => {
            setShowCreateLinkModal(open);
            if (!open) {
              setSelectedApplicant(null);
            }
          }}
          applicant={{
            id: selectedApplicant.id,
            name: selectedApplicant.name,
            email: selectedApplicant.email,
            avatarUrl: selectedApplicant.avatarUrl,
            positionId: selectedApplicant.positionId,
            position: selectedApplicant.position,
          }}
          onSuccess={() => {
            fetchApplicantsWithEvaluationLinks();
            setShowCreateLinkModal(false);
            setSelectedApplicant(null);
          }}
        />
      )}

      <CalendarQrCodeDialog
        appLogoUrl={appLogoUrl}
        isMobile={isMobile}
        {...qrDialogState}
      />

      <CalendarMobileCreateButton isMobile={isMobile} onCreateLink={handleOpenCreateModal} />

      {/* Edit Evaluation Link Modal */}
      {selectedApplicant && (
        <CreateEvaluateLinkModal
          isOpen={editEvaluationLinkState.isOpen}
          onOpenChange={editEvaluationLinkState.onOpenChange}
          applicant={{
            id: selectedApplicant.id,
            name: selectedApplicant.name,
            email: selectedApplicant.email || null,
            avatarUrl: selectedApplicant.avatarUrl || null,
            position: selectedApplicant.position || null
          }}
          editMode={true}
        />
      )}
    </>
  );
}

function EvaluatePageFallback() {
  return <CalendarPageLoadingState fullScreen={false} />;
}

export default function EvaluatePage() {
  return (
    <Suspense fallback={<EvaluatePageFallback />}>
      <EvaluatePageContent />
    </Suspense>
  );
}
