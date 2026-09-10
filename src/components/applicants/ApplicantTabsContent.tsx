import { useJobMatchFeature } from '@/hooks/useJobMatchFeature';
import {
  ApplicantEducationTabContent,
  ApplicantExperienceTabContent,
  ApplicantAttachmentsTabContent,
  ApplicantInfoTabContent,
  ApplicantJobsTabContent,
} from './ApplicantTabsContentParts';
import type { ApplicantTabsContentProps } from './ApplicantTabsContentTypes';

export function ApplicantTabsContent(props: ApplicantTabsContentProps) {
  const { isJobMatchEnabled } = useJobMatchFeature();

  return (
    <div className="h-full bg-background">
      {props.activeTab === 'jobs' && (
        <ApplicantJobsTabContent props={props} isJobMatchEnabled={isJobMatchEnabled} />
      )}
      {props.activeTab === 'applicant-info' && (
        <ApplicantInfoTabContent props={props} />
      )}
      {props.activeTab === 'education' && (
        <ApplicantEducationTabContent props={props} />
      )}
      {props.activeTab === 'experience' && (
        <ApplicantExperienceTabContent props={props} />
      )}
      {props.activeTab === 'attachments' && (
        <ApplicantAttachmentsTabContent props={props} />
      )}
    </div>
  );
}
