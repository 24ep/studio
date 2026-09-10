import { Filter } from "lucide-react";
import type {
  CustomFieldFormTabProps,
  CustomFieldModelProps,
} from "./CustomFieldDrawerFormTabTypes";
import { TabSectionHeader } from "./CustomFieldDrawerFormTabTypes";
import {
  ApplicantDetailSectionField,
  PositionDetailSectionField,
  VisibilityCheckbox,
} from "./CustomFieldVisibilityTabParts";

export function CustomFieldVisibilityTab({
  form,
  modelName,
  showInFullApplicantDetail,
  showInApplicantDetail,
  showInPositionSettings,
}: CustomFieldFormTabProps &
  CustomFieldModelProps & {
    showInFullApplicantDetail: boolean;
    showInApplicantDetail: boolean;
    showInPositionSettings: boolean;
  }) {
  return (
    <div className="space-y-6">
      <div>
        <TabSectionHeader
          icon={<Filter className="h-5 w-5 text-primary" />}
          title="Display Settings"
          description="Configure where this field appears throughout the application"
        />
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <VisibilityCheckbox
              form={form}
              name="showInFilter"
              label="Show in Filter"
              description="Display this field in list filters"
            />
            <VisibilityCheckbox
              form={form}
              name="showInApplicantDetail"
              label="Show in Applicant Detail"
              description="Display in Applicant detail view"
            />
            <VisibilityCheckbox
              form={form}
              name="showInFullApplicantDetail"
              label="Show in Full Applicant Detail"
              description="Display in full Applicant detail page"
            />
            <VisibilityCheckbox
              form={form}
              name="showInTaskBoardFilter"
              label="Show in Task Board Filter"
              description="Display in task board filters"
            />
            {modelName === "Position" && (
              <VisibilityCheckbox
                form={form}
                name="showInPositionSettings"
                label="Show in Position Settings"
                description="Display in position settings page"
              />
            )}
            {modelName === "Headcount" && (
              <VisibilityCheckbox
                form={form}
                name="showInHeadcountDetail"
                label="Show in Headcount Detail"
                description="Display in headcount detail view"
              />
            )}
            {modelName === "Applicant" &&
              (showInFullApplicantDetail || showInApplicantDetail) && (
                <ApplicantDetailSectionField form={form} />
              )}
            {modelName === "Position" && showInPositionSettings && (
              <PositionDetailSectionField form={form} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
