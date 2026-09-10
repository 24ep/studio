"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import ApplicantSourceAlertDialog from '@/components/settings/ApplicantSourceAlertDialog';
import ApplicantSourceModal from '@/components/settings/ApplicantSourceModal';

import {
  ApplicantSourcesErrorBanner,
  ApplicantSourcesTable,
} from './ApplicantSourcesPageParts';
import {
  CREATE_APPLICANT_SOURCE_EVENT,
  LOAD_APPLICANT_SOURCES_EVENT,
} from './applicant-sources-events';
import { useApplicantSourcesPage } from './use-applicant-sources-page';

export default function ApplicantSourcesPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const isAuthenticated = sessionStatus === 'authenticated';

  const {
    sources,
    isLoading,
    fetchError,
    isModalOpen,
    editingSource,
    sourceToDelete,
    isReordering,
    fetchSources,
    openCreateModal,
    openEditModal,
    closeModal,
    handleModalSubmit,
    handleDeleteSelected,
    handleLoadFromAppKit,
    setSourceToDelete,
    handleReorder,
    selectedIds, setSelectedIds, isBulkUpdating, handleBulkStatus,
  } = useApplicantSourcesPage(isAuthenticated);

  useEffect(() => {
    const handleAdminCenterAction = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === CREATE_APPLICANT_SOURCE_EVENT) {
        openCreateModal();
      }

      if (
        event.data?.type === LOAD_APPLICANT_SOURCES_EVENT
        && (event.data.environment === 'development' || event.data.environment === 'production')
      ) {
        void handleLoadFromAppKit(event.data.environment);
      }
    };

    window.addEventListener('message', handleAdminCenterAction);
    return () => window.removeEventListener('message', handleAdminCenterAction);
  }, [handleLoadFromAppKit, openCreateModal]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [router, sessionStatus]);

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-4 space-y-4">
      {fetchError && (
        <ApplicantSourcesErrorBanner
          message={fetchError}
          onRetry={fetchSources}
        />
      )}

      <ApplicantSourcesTable
        sources={sources}
        isLoading={isLoading}
        isReordering={isReordering}
        onEdit={openEditModal}
        onDelete={setSourceToDelete}
        onReorder={handleReorder}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        isBulkUpdating={isBulkUpdating}
        onBulkStatus={handleBulkStatus}
      />

      <ApplicantSourceModal
        open={isModalOpen}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        source={editingSource}
      />

      <ApplicantSourceAlertDialog
        open={!!sourceToDelete}
        onConfirm={handleDeleteSelected}
        onCancel={() => setSourceToDelete(null)}
        source={sourceToDelete}
      />
    </div>
  );
}
