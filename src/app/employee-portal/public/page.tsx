import { CompanyPortalExperience } from '@/components/company-portal/CompanyPortalExperience';

export default function PublicEmployeePortalPage() {
  return (
    <CompanyPortalExperience
      apiPath="/api/public/employee-portal"
      footerLabel="Employee portal extranet"
      portalVariant="employee"
    />
  );
}
