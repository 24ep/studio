import { CompanyPortalExperience } from '@/components/company-portal/CompanyPortalExperience';
import { getValidatedAuthSession } from '@/lib/validated-auth-session';
import { redirect } from 'next/navigation';

export default async function EmployeePortalPage() {
  const session = await getValidatedAuthSession();
  if (!session) redirect('/auth/signin');

  return (
    <CompanyPortalExperience
      apiPath="/api/employee-portal"
      fullPageHref="/employee-portal/public"
      footerLabel="Employee portal intranet"
      portalVariant="employee"
    />
  );
}
