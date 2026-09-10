// src/app/Applicants/page.tsx - Server Component
import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ApplicantsPageClient } from '@/components/applicants/ApplicantsPageClient';
import SafeComponentWrapper from '@/components/ui/safe-component-wrapper';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { hasPermission } from '@/lib/permissions';
import { getApplicantsPageInitialData } from './applicants-page-initial-data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ApplicantsPageServer() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (!hasPermission(session.user, 'applicantS_VIEW')) {
    redirect('/unauthorized');
  }

  const {
    initialApplicants,
    initialAvailablePositions,
    initialAvailableStages,
    initialFetchError,
  } = await getApplicantsPageInitialData();

  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading applicants...</div>}>
        <SafeComponentWrapper
          fallbackTitle="Applicants Page Error"
          fallbackDescription="There was an issue loading the applicants page. This may be due to a temporary initialization problem."
        >
          <ErrorBoundary>
            <ApplicantsPageClient
              initialApplicants={initialApplicants}
              initialAvailablePositions={initialAvailablePositions}
              initialAvailableStages={initialAvailableStages}
              initialFetchError={initialFetchError}
              userSession={{
                id: session.user.id,
                role: session.user.role || '',
                name: session.user.name || null,
                modulePermissions: session.user.modulePermissions || [],
              }}
            />
          </ErrorBoundary>
        </SafeComponentWrapper>
      </Suspense>
    </ErrorBoundary>
  );
}
