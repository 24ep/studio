import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasPermission } from '@/lib/permissions';
import { PayrollApprovalRoutesClient } from './PayrollApprovalRoutesClient';
import { PayrollCalculationAssumptionsCard } from './PayrollCalculationAssumptionsCard';

export default async function PayrollApprovalRoutesPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin');
  if (!hasPermission(session.user, 'SYSTEM_SETTINGS_VIEW')) redirect('/unauthorized');
  const canEdit = hasPermission(session.user, 'SYSTEM_SETTINGS_EDIT');
  return (
    <div className="min-h-full bg-background p-3 sm:p-4">
      <PayrollCalculationAssumptionsCard canEdit={canEdit} />
      <PayrollApprovalRoutesClient canEdit={canEdit} />
    </div>
  );
}
