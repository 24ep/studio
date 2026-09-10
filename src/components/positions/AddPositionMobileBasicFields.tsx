"use client";

import { Controller, type UseFormReturn } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { Grade, PositionLevel } from '@/lib/types';

import type { AddPositionFormValues } from './add-position-form';
import type { RecruiterOption } from './AddPositionMobileDrawerTypes';

interface MobileStepProps {
  form: UseFormReturn<AddPositionFormValues>;
}

export function MobileTextField({
  disabled,
  error,
  id,
  label,
  placeholder,
  register,
}: {
  disabled: boolean;
  error?: string;
  id: string;
  label: string;
  placeholder: string;
  register: ReturnType<UseFormReturn<AddPositionFormValues>['register']>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} placeholder={placeholder} {...register} disabled={disabled} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function MobilePositionLevelField({
  form,
  isLoadingLevels,
  isSaving,
  positionLevels,
}: MobileStepProps & {
  isLoadingLevels: boolean;
  isSaving: boolean;
  positionLevels: PositionLevel[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="position-level-mobile">Position Level</Label>
      <Controller
        name="positionLevel"
        control={form.control}
        render={({ field }) => (
          <Select
            value={field.value || 'none'}
            onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
          >
            <SelectTrigger disabled={isSaving || isLoadingLevels}>
              <SelectValue placeholder={isLoadingLevels ? 'Loading...' : 'Select level'} />
            </SelectTrigger>
            <SelectContent selectId="mobile-position-level">
              <SelectItem value="none">No Level</SelectItem>
              {positionLevels.map((level) => (
                <SelectItem key={level.id} value={level.name}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: level.color || '#6B7280' }}
                    />
                    {level.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

export function MobileGradeField({
  form,
  grades,
}: MobileStepProps & {
  grades: Grade[];
}) {
  return (
    <MobileSelectField
      control={form.control}
      name="gradeId"
      label="Grade"
      placeholder="Select grade"
      selectId="mobile-grade"
      emptyLabel="No Grade"
      options={grades.map((grade) => ({
        label: grade.label || grade.name,
        value: grade.id,
      }))}
    />
  );
}

export function MobileRecruiterField({
  form,
  recruiters,
}: MobileStepProps & {
  recruiters: RecruiterOption[];
}) {
  return (
    <MobileSelectField
      control={form.control}
      name="recruiterId"
      label="Assigned Recruiter"
      placeholder="Select recruiter"
      selectId="mobile-recruiter"
      emptyLabel="No Recruiter"
      options={recruiters.map((recruiter) => ({
        label: recruiter.name,
        value: recruiter.id,
      }))}
    />
  );
}

export function MobileOpenPositionField({ form }: MobileStepProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <Label htmlFor="isOpen-mobile">Position is Open</Label>
      <Controller
        name="isOpen"
        control={form.control}
        render={({ field }) => (
          <Switch checked={field.value} onCheckedChange={field.onChange} />
        )}
      />
    </div>
  );
}

function MobileSelectField({
  control,
  emptyLabel,
  label,
  name,
  options,
  placeholder,
  selectId,
}: {
  control: UseFormReturn<AddPositionFormValues>['control'];
  emptyLabel: string;
  label: string;
  name: 'gradeId' | 'recruiterId';
  options: Array<{ label: string; value: string }>;
  placeholder: string;
  selectId: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            value={field.value || 'none'}
            onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent selectId={selectId}>
              <SelectItem value="none">{emptyLabel}</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}
