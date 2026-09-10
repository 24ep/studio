"use client";

import type { Dispatch, SetStateAction } from "react";
import { CircleStackIcon as Database } from "@heroicons/react/24/outline";

import { CustomFieldFilter } from "@/components/ui/CustomFieldFilter";
import type { ApplicantCustomFieldFilterValue, CustomFieldDefinition } from "@/lib/types";
import { ApplicantMobileFilterSection } from "./ApplicantMobileFilterSection";
import { updateCustomFieldFilters } from "./applicant-mobile-filters-panel-utils";

export function ApplicantMobileCustomFieldsSection({
  customFieldFilters,
  filterableCustomFields,
  onCustomFieldFiltersChange,
}: {
  customFieldFilters: Record<string, ApplicantCustomFieldFilterValue>;
  filterableCustomFields: CustomFieldDefinition[];
  onCustomFieldFiltersChange: Dispatch<SetStateAction<Record<string, ApplicantCustomFieldFilterValue>>>;
}) {
  if (filterableCustomFields.length === 0) {
    return null;
  }

  return (
    <ApplicantMobileFilterSection
      value="custom-fields"
      title="Custom Fields"
      icon={Database}
      contentClassName="pt-4 space-y-4"
    >
      {filterableCustomFields.map((field) => (
        <CustomFieldFilter
          key={field.field_code}
          definition={field}
          value={customFieldFilters[field.field_code]}
          onChange={(value) => {
            onCustomFieldFiltersChange((prev) => updateCustomFieldFilters(prev, field.field_code, value));
          }}
          className="w-full"
        />
      ))}
    </ApplicantMobileFilterSection>
  );
}
