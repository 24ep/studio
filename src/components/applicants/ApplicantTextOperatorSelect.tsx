"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ApplicantFilterValues } from '@/lib/types';

export type ApplicantTextOperator = NonNullable<ApplicantFilterValues['nameOperator']>;
export type ApplicantLocationOperator = NonNullable<ApplicantFilterValues['locationOperator']>;

interface ApplicantTextOperatorSelectProps<T extends ApplicantTextOperator | ApplicantLocationOperator> {
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  includeOther?: boolean;
  triggerClassName?: string;
}

const BASE_TEXT_OPERATORS: Array<{ value: ApplicantTextOperator; label: string }> = [
  { value: 'contains', label: 'contains' },
  { value: 'is', label: 'is' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'endsWith', label: 'ends with' },
];

export function ApplicantTextOperatorSelect<T extends ApplicantTextOperator | ApplicantLocationOperator>({
  value,
  onChange,
  disabled = false,
  includeOther = false,
  triggerClassName = 'h-8 text-xs',
}: ApplicantTextOperatorSelectProps<T>) {
  return (
    <Select value={value} onValueChange={nextValue => onChange(nextValue as T)} disabled={disabled}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BASE_TEXT_OPERATORS.map(operator => (
          <SelectItem key={operator.value} value={operator.value}>
            {operator.label}
          </SelectItem>
        ))}
        {includeOther && (
          <SelectItem value="other">other</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
