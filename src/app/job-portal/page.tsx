import { CompanyPortalExperience } from '@/components/company-portal/CompanyPortalExperience';

export default function JobPortalPage() {
  return (
    <CompanyPortalExperience
      footerLabel="Applicant job portal"
      fullPageHref="/job-portal/public"
      portalVariant="job"
    />
  );
}
