import { FullApplicantDetailMainContent } from "./FullApplicantDetailMainContent";
import type { FullApplicantDetailSectionProps } from "./FullApplicantDetailViewTypes";

interface FullApplicantBodyProps extends FullApplicantDetailSectionProps {
  showSidebar?: boolean;
}

export function FullApplicantBody({
  controller,
  showSidebar = true,
}: FullApplicantBodyProps) {
  return (
    <FullApplicantDetailMainContent
      activeTab={controller.activeTab}
      educationCount={controller.educationCount}
      experienceDuration={controller.experienceDuration}
      reviewMode={controller.isModal}
      isJobMatchEnabled={controller.isJobMatchEnabled}
      isMobile={controller.isMobile}
      jobMatchCount={controller.jobMatchCount}
      onSubmit={controller.handleSubmit(controller.handleSaveDetails)}
      onTabChange={controller.setActiveTab}
      showSidebar={showSidebar}
      tabsContentKey={controller.applicant.id}
      tabsContentProps={{
        activeTab: controller.activeTab,
        applicant: controller.applicant,
        allDbPositions: controller.allDbPositions,
        isEditing: controller.isEditing,
        applicantJobMatches: controller.applicantJobMatches,
        onJobMatchClick: controller.handleJobMatchClick,
        onCopyJobMatch: controller.copyJobMatchToClipboard,
        copiedJobMatchIndex: controller.copiedJobMatchIndex,
        onCopyJobApplied: controller.copyJobAppliedToClipboard,
        copiedJobApplied: controller.copiedJobApplied,
        appliedJobId: controller.appliedJobId,
        appliedFitScore: controller.appliedFitScore,
        appliedJustification: controller.appliedJustification,
        appliedJobBadge: controller.appliedJobBadge,
        onOpenPositionDrawer: controller.handleOpenPositionDrawer,
        control: controller.control,
        register: controller.register,
        errors: controller.errors,
        watch: controller.watch,
        setValue: controller.setValue,
        educationFields: controller.educationFields,
        appendEducation: controller.appendEducation,
        removeEducation: controller.removeEducation,
        experienceFields: controller.experienceFields,
        appendExperience: controller.appendExperience,
        removeExperience: controller.removeExperience,
        skillsFields: controller.skillsFields,
        appendSkill: controller.appendSkill,
        removeSkill: controller.removeSkill,
        jobSuitableFields: controller.jobSuitableFields,
        appendJobSuitable: controller.appendJobSuitable,
        removeJobSuitable: controller.removeJobSuitable,
        jobMatchesFields: controller.jobMatchesFields,
        appendJobMatch: controller.appendJobMatch,
        removeJobMatch: controller.removeJobMatch,
        calculateTotalExperienceDuration: controller.calculateTotalExperienceDuration,
        comments: controller.comments,
        resumes: controller.resumes,
        onRefresh: controller.onRefresh,
        onCustomFieldChange: controller.handleCustomFieldChange,
        customFieldsRefreshTrigger: controller.customFieldsRefreshTrigger,
      }}
      sidebarProps={{
        applicant: controller.applicant,
        comments: controller.comments,
        resumes: controller.resumes,
        isEditing: controller.isEditing,
        onRefresh: controller.onRefresh,
      }}
    />
  );
}
