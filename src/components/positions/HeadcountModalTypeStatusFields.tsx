import type { HeadcountStatus, HeadcountType } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { HeadcountFormSectionProps } from './HeadcountModalFormTypes';

const HEADCOUNT_STATUS_OPTIONS: { value: HeadcountStatus; label: string }[] = [
  { value: 'vacant', label: 'Vacant' },
  { value: 'filled', label: 'Filled' },
];

export function HeadcountTypeStatusFields({
  formData,
  headcountTypeOptions,
  setFormData,
}: Pick<HeadcountFormSectionProps, 'formData' | 'setFormData'> & {
  headcountTypeOptions: Array<{ value: HeadcountType; label: string }>;
}) {
  const isApprovalStatus = formData.status === 'pending' || formData.status === 'rejected';

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="type">Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value: HeadcountType) => setFormData(prev => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent selectId="headcount-type-select">
            {headcountTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        {isApprovalStatus ? (
          <div className="space-y-1.5">
            <div
              className={
                formData.status === 'pending'
                  ? 'flex h-10 items-center rounded-md border border-amber-200 bg-amber-50 px-3 text-sm font-medium text-amber-700'
                  : 'flex h-10 items-center rounded-md border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-700'
              }
            >
              {formData.status === 'pending' ? 'Pending approval' : 'Rejected'}
            </div>
            <p className="text-xs text-muted-foreground">
              Approval status is managed from Headcount Requests.
            </p>
          </div>
        ) : (
          <Select
            value={formData.status}
            onValueChange={(value: HeadcountStatus) => setFormData(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent selectId="headcount-status-select">
              {HEADCOUNT_STATUS_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.value === 'filled' && !formData.applicantId}
                >
                  {option.label}
                  {option.value === 'filled' && !formData.applicantId && ' (requires applicant assignment)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {formData.status === 'filled' && !formData.applicantId && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Note: Status "filled" requires an applicant assignment. Assign the applicant through the applicant details page first.
          </p>
        )}
      </div>
    </div>
  );
}
