"use client";

import { Briefcase, Building2 } from 'lucide-react';

import type { AddPositionBasicInfoSectionProps } from './AddPositionModalSectionTypes';
import {
  AddPositionGradeField,
  AddPositionLevelField,
  AddPositionOpenSwitch,
  AddPositionRecruiterField,
  AddPositionSelectField,
  AddPositionTextField,
} from './AddPositionBasicInfoFields';
import { PositionOrganizationPathFields } from './PositionOrganizationPathFields';

export function AddPositionBasicInfoSection({
  availableRecruiter,
  form,
  grades,
  isLoadingLevels,
  isSaving,
  positionLevels,
  organizationUnits,
}: AddPositionBasicInfoSectionProps) {
  return (
    <div className="space-y-7">
      <section aria-labelledby="position-organization-heading">
        <div className="mb-5 flex items-start gap-2.5">
          <Building2 className="mt-0.5 h-5 w-5 text-primary" />
          <h3 id="position-organization-heading" className="text-base font-semibold">Where this role sits</h3>
        </div>
        <PositionOrganizationPathFields
          form={form}
          units={organizationUnits}
          disabled={isSaving}
          detailsBeforeUnit={(
            <div className="grid gap-5 md:grid-cols-2">
              <AddPositionSelectField disabled={isSaving} form={form} label="Reports to (Optional)" name="reportsTo" options={['Engineering Manager', 'Director of Engineering', 'VP of Product', 'Head of People']} placeholder="Select manager" />
              <AddPositionSelectField disabled={isSaving} form={form} label="Cost center (Optional)" name="costCenter" options={['ENG-PROD', 'ENG-PLAT', 'PROD-DES', 'PEOPLE-OPS']} placeholder="Select cost center" />
            </div>
          )}
          unitCompanion={(
            <AddPositionSelectField disabled={isSaving} form={form} label="Budget (Optional)" name="budget" options={['Approved headcount', 'Department budget', 'Replacement hire', 'Pending approval']} placeholder="Select budget" />
          )}
        />
      </section>

      <section aria-labelledby="position-role-setup-heading" className="border-t border-border pt-6">
        <div className="mb-5 flex items-start gap-2.5">
          <Briefcase className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <h3 id="position-role-setup-heading" className="text-base font-semibold">Role setup</h3>
            <p className="mt-1 text-xs text-muted-foreground">Define the key settings and owner for this position.</p>
          </div>
        </div>

        <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
          <AddPositionTextField
            disabled={isSaving}
            error={form.formState.errors.title?.message}
            id="title-add"
            label="Position title *"
            placeholder="Enter position title"
            registration={form.register('title')}
          />

          <AddPositionSelectField disabled={isSaving} form={form} label="Employment type *" name="employmentType" options={['Full-time', 'Part-time', 'Contract', 'Internship']} placeholder="Select employment type" />

          <AddPositionLevelField
            form={form}
            isLoadingLevels={isLoadingLevels}
            isSaving={isSaving}
            positionLevels={positionLevels}
          />

          <AddPositionSelectField disabled={isSaving} form={form} label="Job family (Optional)" name="jobFamily" options={['Engineering', 'Product', 'Design', 'Finance', 'People', 'Customer Success']} placeholder="Select job family" />

          <AddPositionGradeField form={form} grades={grades} />

          <AddPositionRecruiterField
            availableRecruiter={availableRecruiter}
            form={form}
          />
        </div>

        <div className="sr-only">
          <AddPositionOpenSwitch form={form} />
        </div>
      </section>
    </div>
  );
}
