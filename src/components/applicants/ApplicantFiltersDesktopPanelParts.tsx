import {
  FunnelIcon as Filter,
  FunnelIcon as FilterX,
} from '@heroicons/react/24/outline';

import { ApplicantCustomFieldsFilterSection } from './ApplicantCustomFieldsFilterSection';
import { ApplicantFilterActionBar } from './ApplicantFilterActionBar';
import type { ApplicantFiltersDesktopPanelProps } from './ApplicantFiltersDesktopPanelTypes';

type CustomFieldsPanelProps = Pick<
  ApplicantFiltersDesktopPanelProps,
  | 'customFieldFilters'
  | 'filterableCustomFields'
  | 'isAiSearching'
  | 'isLoading'
  | 'isLoadingCustomFields'
  | 'onCustomFieldFiltersChange'
  | 'onScheduleApply'
>;

type DesktopActionBarProps = Pick<ApplicantFiltersDesktopPanelProps, 'onApply' | 'onReset'>;

export function ApplicantDesktopCustomFieldsPanel({
  customFieldFilters,
  filterableCustomFields,
  isAiSearching,
  isLoading,
  isLoadingCustomFields,
  onCustomFieldFiltersChange,
  onScheduleApply,
}: CustomFieldsPanelProps) {
  return (
    <ApplicantCustomFieldsFilterSection
      fields={filterableCustomFields}
      values={customFieldFilters}
      isLoading={isLoadingCustomFields}
      disabled={isLoading || isAiSearching}
      onReset={() => {
        onCustomFieldFiltersChange({});
        onScheduleApply(0);
      }}
      onFieldChange={(fieldCode, value) => {
        onCustomFieldFiltersChange({
          ...customFieldFilters,
          [fieldCode]: value,
        });
        onScheduleApply(0);
      }}
    />
  );
}

export function ApplicantDesktopFilterActionBar({
  onApply,
  onReset,
}: DesktopActionBarProps) {
  return (
    <ApplicantFilterActionBar
      primaryLabel="Apply Filters"
      secondaryLabel="Clear All"
      onPrimary={onApply}
      onSecondary={onReset}
      primaryIcon={Filter}
      secondaryIcon={FilterX}
      className="p-4"
      buttonSize="sm"
      buttonClassName="flex-1 transition-all duration-200 ease-in-out hover:scale-105"
    />
  );
}
