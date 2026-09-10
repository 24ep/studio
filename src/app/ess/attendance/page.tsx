import { EmployeeSelfServicePage } from '@/components/hr/EmployeeSelfServicePage';

export default async function EssAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  return <EmployeeSelfServicePage view="attendance" attendanceMode={view === 'check-in' ? 'check-in' : 'history'} />;
}
