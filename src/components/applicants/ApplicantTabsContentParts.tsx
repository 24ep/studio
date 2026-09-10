import { JobAppliedTab } from './tabs/JobAppliedTab';
import { JobMatchTab } from './tabs/JobMatchTab';
import { ApplicantInfoTab } from './tabs/ApplicantInfoTab';
import { ContactTab } from './tabs/ContactTab';
import { EducationTab } from './tabs/EducationTab';
import { ExperienceTab } from './tabs/ExperienceTab';
import ApplicantResumesSection from './ApplicantResumesSection';
import type { ApplicantTabsContentProps } from './ApplicantTabsContentTypes';

export function ApplicantJobsTabContent({
  props,
  isJobMatchEnabled,
}: {
  props: ApplicantTabsContentProps;
  isJobMatchEnabled: boolean;
}) {
  return (
    <div className="space-y-4 h-full">
      <JobAppliedTab
        applicant={props.applicant}
        allDbPositions={props.allDbPositions}
        isEditing={props.isEditing}
        onCopyJobApplied={props.onCopyJobApplied}
        copiedJobApplied={props.copiedJobApplied}
        appliedJobId={props.appliedJobId}
        appliedFitScore={props.appliedFitScore}
        appliedJustification={props.appliedJustification}
        appliedJobBadge={props.appliedJobBadge}
        onOpenPositionDrawer={props.onOpenPositionDrawer}
        onCustomFieldChange={props.onCustomFieldChange}
        hideApplicantDetails={true}
        register={props.register}
        setValue={props.setValue}
      />
      {isJobMatchEnabled && (
        <JobMatchTab
          applicant={props.applicant}
          allDbPositions={props.allDbPositions}
          isEditing={props.isEditing}
          applicantJobMatches={props.applicantJobMatches}
          onJobMatchClick={props.onJobMatchClick}
          onCopyJobMatch={props.onCopyJobMatch}
          copiedJobMatchIndex={props.copiedJobMatchIndex}
        />
      )}
    </div>
  );
}

export function ApplicantInfoTabContent({ props }: { props: ApplicantTabsContentProps }) {
  return (
    <div className="space-y-4 h-full">
      <ApplicantInfoTab
        applicant={props.applicant}
        isEditing={props.isEditing}
        register={props.register}
        errors={props.errors}
        watch={props.watch}
        control={props.control}
      />
      <ContactTab
        applicant={props.applicant}
        isEditing={props.isEditing}
        register={props.register}
        errors={props.errors}
        watch={props.watch}
        setValue={props.setValue}
        skillsFields={props.skillsFields}
        appendSkill={props.appendSkill}
        removeSkill={props.removeSkill}
        onCustomFieldChange={props.onCustomFieldChange}
        customFieldsRefreshTrigger={props.customFieldsRefreshTrigger}
      />
    </div>
  );
}

export function ApplicantEducationTabContent({ props }: { props: ApplicantTabsContentProps }) {
  return (
    <div className="space-y-4 h-full">
      <EducationTab
        applicant={props.applicant}
        isEditing={props.isEditing}
        control={props.control}
        register={props.register}
        errors={props.errors}
        watch={props.watch}
        setValue={props.setValue}
        educationFields={props.educationFields}
        appendEducation={props.appendEducation}
        removeEducation={props.removeEducation}
        onCustomFieldChange={props.onCustomFieldChange}
      />
    </div>
  );
}

export function ApplicantExperienceTabContent({ props }: { props: ApplicantTabsContentProps }) {
  return (
    <div className="space-y-4 h-full">
      <ExperienceTab
        applicant={props.applicant}
        isEditing={props.isEditing}
        control={props.control}
        register={props.register}
        errors={props.errors}
        watch={props.watch}
        setValue={props.setValue}
        experienceFields={props.experienceFields}
        appendExperience={props.appendExperience}
        removeExperience={props.removeExperience}
        calculateTotalExperienceDuration={props.calculateTotalExperienceDuration}
        onCustomFieldChange={props.onCustomFieldChange}
      />
    </div>
  );
}

export function ApplicantAttachmentsTabContent({ props }: { props: ApplicantTabsContentProps }) {
  return (
    <div className="h-full">
      <ApplicantResumesSection
        applicantId={props.applicant.id}
        resumes={props.resumes ?? []}
        isEditing={props.isEditing}
        onResumesChange={() => props.onRefresh?.()}
      />
    </div>
  );
}
