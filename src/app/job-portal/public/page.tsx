import { CompanyPortalExperience } from '@/components/company-portal/CompanyPortalExperience';

export const metadata = {
  title: 'Open Jobs',
  description: 'Explore current job openings and apply online.',
};

export default function PublicJobPortalPage() {
  return (
    <CompanyPortalExperience
      apiPath="/api/public/job-portal"
      footerLabel="Job openings and online applications"
      portalVariant="job"
    />
  );
}
