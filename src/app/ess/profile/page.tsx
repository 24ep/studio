import { auth } from '@/auth';
import { MissingEmployeePlaceholder } from '@/components/ess/EssShared';
import { HrEmployeeProfilePage } from '@/components/hr/HrEmployeeProfilePage';
import { getEmployeeForUser } from '@/lib/hr/ess-service';

export default async function EssProfilePage() {
  const session = await auth();
  const employee = session?.user?.id
    ? await getEmployeeForUser(session.user.id, session.user.email)
    : null;

  if (!employee) {
    return (
      <main className="grid min-h-[calc(100dvh-4rem)] place-items-center px-4 py-8">
        <MissingEmployeePlaceholder message="No employee record is linked to this user yet." />
      </main>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-1">
      <HrEmployeeProfilePage employeeId={employee.id} selfService />
    </div>
  );
}
