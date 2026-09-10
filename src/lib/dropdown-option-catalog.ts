export type DropdownOption = {
  value: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
};

export type DropdownOptionGroup = {
  key: string;
  label: string;
  description: string;
  options: DropdownOption[];
};

const group = (key: string, label: string, description: string, values: string[]): DropdownOptionGroup => ({
  key,
  label,
  description,
  options: values.map((value, sortOrder) => ({
    value,
    label: value.replaceAll('_', ' ').replace(/\b\w/g, character => character.toUpperCase()),
    isActive: true,
    sortOrder,
  })),
});

// Business vocabularies may be relabelled or disabled by administrators. Workflow
// state machines, permissions, HTTP methods, booleans, dates, and entity lookups
// intentionally remain fixed/dynamic because changing their values would violate
// API and database contracts.
export const dropdownOptionCatalogDefaults: DropdownOptionGroup[] = [
  group('employment_types', 'Employment types', 'Worker engagement types used on employee records.', ['full_time', 'part_time', 'contractor', 'subcontract', 'intern']),
  group('offboarding_exit_types', 'Offboarding exit types', 'Reasons used to start employee exit workflows.', ['resignation', 'termination', 'retirement', 'abandonment', 'contract_end']),
  group('transportation_modes', 'Transportation modes', 'Transport benefits and commute arrangements.', ['company_bus', 'van', 'car_allowance', 'shuttle']),
  group('currencies', 'Currencies', 'Currencies available in expenses and financial entry forms.', ['THB', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD']),
  group('appraisal_cycle_types', 'Appraisal cycle types', 'Review-cycle classifications.', ['annual', 'mid_year', 'quarterly', 'probation', 'project', 'promotion', 'performance_improvement', 'ad_hoc']),
  group('appraisal_reviewer_relationships', 'Appraisal reviewer relationships', 'Relationships available when assigning reviewers.', ['peer', 'direct_report', 'project_manager', 'matrix_manager', 'second_level_manager']),
  group('performance_conversation_types', 'Performance conversation types', 'Types of performance conversations.', ['one_on_one', 'probation', 'monthly', 'quarterly', 'performance_improvement', 'development', 'career_conversation']),
  group('performance_feedback_types', 'Performance feedback types', 'Feedback relationship classifications.', ['manager', 'peer', 'project', 'coaching', 'improvement']),
  group('recognition_categories', 'Recognition categories', 'Categories used for employee recognition.', ['great_teamwork', 'customer_impact', 'innovation', 'leadership', 'ownership', 'excellent_delivery', 'learning_achievement']),
  group('performance_evidence_types', 'Performance evidence types', 'Evidence classifications for performance records.', ['project_achievement', 'certification', 'work_sample', 'feedback', 'training', 'manager_validation']),
  group('development_activity_types', 'Development activity types', 'Activities available in development plans.', ['learning_course', 'coaching', 'mentoring', 'stretch_assignment', 'project_assignment', 'on_the_job', 'certification']),
  group('development_plan_types', 'Development plan types', 'Purposes available for employee development plans.', ['performance_improvement', 'skill_development', 'career_development', 'mandatory']),
  group('pay_change_types', 'Pay change types', 'Reasons used for compensation changes.', ['salary_increase', 'promotion', 'merit', 'market', 'cost_of_living', 'correction']),
  group('benefit_plan_types', 'Benefit plan types', 'Benefit categories available in payroll.', ['health_insurance', 'life_insurance', 'retirement', 'provident_fund', 'wellness', 'transport']),
  group('organization_types', 'Organization types', 'Legal organization classifications.', ['Private company', 'Public company', 'Government', 'Nonprofit', 'Partnership', 'Sole proprietorship', 'Other']),
  group('organization_sizes', 'Organization sizes', 'Employee-count ranges used in the company profile.', ['1-10', '11-50', '51-200', '201-500', '501-1,000', '1,001-5,000', '5,001-10,000', '10,000+']),
];

export const DROPDOWN_OPTION_CATALOG_SETTING = 'dropdownOptionCatalog';

export function defaultDropdownOptions(key: string) {
  return dropdownOptionCatalogDefaults.find(group => group.key === key)?.options || [];
}

export function normalizeDropdownOptionCatalog(value: unknown): DropdownOptionGroup[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate): DropdownOptionGroup[] => {
    if (!candidate || typeof candidate !== 'object') return [];
    const record = candidate as Partial<DropdownOptionGroup>;
    if (!record.key?.trim() || !record.label?.trim() || !Array.isArray(record.options)) return [];
    const options = record.options.flatMap((option, index): DropdownOption[] => {
      if (!option || typeof option !== 'object') return [];
      const item = option as Partial<DropdownOption>;
      if (!item.value?.trim() || !item.label?.trim()) return [];
      return [{ value: item.value, label: item.label, isActive: item.isActive !== false, sortOrder: Number.isFinite(item.sortOrder) ? Number(item.sortOrder) : index }];
    });
    return [{ key: record.key, label: record.label, description: String(record.description || ''), options }];
  });
}
