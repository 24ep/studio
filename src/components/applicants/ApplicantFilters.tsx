"use client";

import { ApplicantFiltersView } from './ApplicantFiltersView';
import { useApplicantFiltersController, type UseApplicantFiltersControllerOptions } from './hooks/use-applicant-filters-controller';
import type { ApplicantFilterValues } from '@/lib/types';

export type { ApplicantFilterValues };

type ApplicantFiltersProps = UseApplicantFiltersControllerOptions;

export function ApplicantFilters(props: ApplicantFiltersProps) {
  const viewProps = useApplicantFiltersController(props);

  return <ApplicantFiltersView {...viewProps} />;
}
