"use client";

import { Controller } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RecruiterAvatar } from '@/components/ui/recruiter-avatar';
import type { AddPositionBasicInfoSectionProps } from './AddPositionModalSectionTypes';

interface AddPositionTextFieldProps {
  disabled: boolean;
  error?: string;
  id: string;
  label: string;
  placeholder: string;
  registration: ReturnType<AddPositionBasicInfoSectionProps['form']['register']>;
}

export function AddPositionTextField({
  disabled,
  error,
  id,
  label,
  placeholder,
  registration,
}: AddPositionTextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-medium text-sm">{label}</Label>
      <div>
        <Input
          id={id}
          placeholder={placeholder}
          {...registration}
          disabled={disabled}
        />
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}

export function AddPositionSelectField({
  disabled = false,
  form,
  label,
  name,
  options,
  placeholder,
}: {
  disabled?: boolean;
  form: AddPositionBasicInfoSectionProps['form'];
  label: string;
  name: 'reportsTo' | 'costCenter' | 'budget' | 'employmentType' | 'jobFamily';
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <Select
            value={field.value || 'none'}
            onValueChange={(value) => field.onChange(value === 'none' ? '' : value)}
          >
            <SelectTrigger disabled={disabled}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent selectId={`add-position-${name}-select`}>
              <SelectItem value="none">{placeholder}</SelectItem>
              {options.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

export function AddPositionLevelField({
  form,
  isLoadingLevels,
  isSaving,
  positionLevels,
}: Pick<AddPositionBasicInfoSectionProps, 'form' | 'isLoadingLevels' | 'isSaving' | 'positionLevels'>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="position-level-add" className="font-medium text-sm">Position level *</Label>
      <div>
        <Controller
          name="positionLevel"
          control={form.control}
          render={({ field }) => (
            <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? null : value)}>
              <SelectTrigger disabled={isSaving || isLoadingLevels}>
                <SelectValue placeholder={isLoadingLevels ? 'Loading levels...' : 'Select position level'} />
              </SelectTrigger>
              <SelectContent selectId="add-position-level-select">
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
        {form.formState.errors.positionLevel && (
          <p className="text-sm text-destructive mt-1">{form.formState.errors.positionLevel.message}</p>
        )}
      </div>
    </div>
  );
}

export function AddPositionGradeField({
  form,
  grades,
}: Pick<AddPositionBasicInfoSectionProps, 'form' | 'grades'>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="grade-add" className="font-medium text-sm">Grade (Optional)</Label>
      <Controller
        name="gradeId"
        control={form.control}
        render={({ field }) => (
          <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? null : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a grade" />
            </SelectTrigger>
            <SelectContent selectId="add-position-grade-select">
              <SelectItem value="none">No Grade</SelectItem>
              {grades.map((grade) => (
                <SelectItem key={grade.id} value={grade.id}>
                  {grade.label || grade.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

export function AddPositionRecruiterField({
  availableRecruiter,
  form,
}: Pick<AddPositionBasicInfoSectionProps, 'availableRecruiter' | 'form'>) {
  const selectedRecruiter = availableRecruiter.find((recruiter) => recruiter.id === form.watch('recruiterId'));

  return (
    <div className="space-y-1.5">
      <Label htmlFor="recruiter-add" className="font-medium text-sm">Assigned recruiter *</Label>
      <Controller
        name="recruiterId"
        control={form.control}
        render={({ field }) => (
          <Select value={field.value || 'none'} onValueChange={(value) => field.onChange(value === 'none' ? null : value)}>
            <SelectTrigger className="h-12">
              {selectedRecruiter ? (
                <span className="flex min-w-0 items-center gap-3 text-left">
                  <RecruiterAvatar user={selectedRecruiter} size="sm" showBorder={false} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{selectedRecruiter.name}</span>
                    <span className="block text-[11px] text-muted-foreground">Recruiter</span>
                  </span>
                </span>
              ) : (
                <SelectValue placeholder="Select a recruiter" />
              )}
            </SelectTrigger>
            <SelectContent selectId="add-position-recruiter-select">
              <SelectItem value="none">No Recruiter</SelectItem>
              {availableRecruiter.map((recruiter) => (
                <SelectItem key={recruiter.id} value={recruiter.id}>
                  <span className="flex items-center gap-2.5">
                    <RecruiterAvatar user={recruiter} size="xs" showBorder={false} />
                    <span>
                      <span className="block text-sm">{recruiter.name}</span>
                      <span className="block text-[11px] text-muted-foreground">Recruiter</span>
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </div>
  );
}

export function AddPositionOpenSwitch({
  form,
}: Pick<AddPositionBasicInfoSectionProps, 'form'>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="isOpen-add" className="font-medium text-sm">Position is Open</Label>
      <Controller
        name="isOpen"
        control={form.control}
        render={({ field }) => (
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </div>
  );
}
