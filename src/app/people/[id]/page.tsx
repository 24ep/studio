import Link from 'next/link';
import { ClockIcon } from '@heroicons/react/24/outline';

import { HrEmployeeProfilePage } from '@/components/hr/HrEmployeeProfilePage';
import { PayrollEmployeeFocusBridge } from '@/components/hr/PayrollEmployeeFocusBridge';

interface PeopleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PeopleDetailPage({ params }: PeopleDetailPageProps) {
  const { id } = await params;
  return (
    <div className="flex min-h-full w-full flex-1 flex-col">
      <PayrollEmployeeFocusBridge />
      <div className="flex min-h-11 items-center justify-end border-b border-border bg-background px-4">
        <Link
          href={`/people/${id}/timeline`}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ClockIcon className="h-4 w-4" aria-hidden="true" />
          Employee timeline
        </Link>
      </div>
      <div className="flex min-h-0 w-full flex-1">
        <HrEmployeeProfilePage employeeId={id} />
      </div>
    </div>
  );
}
