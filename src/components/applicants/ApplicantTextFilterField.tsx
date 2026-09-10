"use client";

import type React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ApplicantTextOperatorSelect,
  type ApplicantLocationOperator,
  type ApplicantTextOperator,
} from './ApplicantTextOperatorSelect';

interface ApplicantTextFilterFieldProps<T extends ApplicantTextOperator | ApplicantLocationOperator> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  operator: T;
  onOperatorChange: (operator: T) => void;
  placeholder: string;
  id?: string;
  disabled?: boolean;
  includeOtherOperator?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onEnter?: () => void;
  labelClassName?: string;
  inputClassName?: string;
  operatorTriggerClassName?: string;
  wrapperClassName?: string;
  gridClassName?: string;
}

export function ApplicantTextFilterField<T extends ApplicantTextOperator | ApplicantLocationOperator>({
  label,
  value,
  onValueChange,
  operator,
  onOperatorChange,
  placeholder,
  id,
  disabled = false,
  includeOtherOperator = false,
  onFocus,
  onBlur,
  onEnter,
  labelClassName = 'text-xs font-medium',
  inputClassName = 'h-8 text-sm col-span-2',
  operatorTriggerClassName = 'h-8 text-xs',
  wrapperClassName = 'space-y-2',
  gridClassName = 'grid grid-cols-3 gap-2',
}: ApplicantTextFilterFieldProps<T>) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onEnter && !disabled) {
      event.preventDefault();
      onEnter();
    }
  };

  return (
    <div className={wrapperClassName}>
      <Label htmlFor={id} className={labelClassName}>{label}</Label>
      <div className={gridClassName}>
        <ApplicantTextOperatorSelect
          value={operator}
          onChange={onOperatorChange}
          disabled={disabled}
          includeOther={includeOtherOperator}
          triggerClassName={operatorTriggerClassName}
        />
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className={inputClassName}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
