import { TrashIcon as Trash2 } from '@heroicons/react/24/outline';
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';
import {
  buildEducationYearRange,
  EDUCATION_MONTHS,
} from './education-tab-utils';
import type { ApplicantFormArrayField } from './EducationTabTypes';

const yearRange = buildEducationYearRange();

interface EducationEditEntryProps {
  field: ApplicantFormArrayField;
  index: number;
  register?: UseFormRegister<EditApplicantFormValues>;
  removeEducation?: (index: number) => void;
  setValue?: UseFormSetValue<EditApplicantFormValues>;
  watch?: UseFormWatch<EditApplicantFormValues>;
}

export function EducationEditEntry({
  field,
  index,
  register,
  watch,
  setValue,
  removeEducation,
}: EducationEditEntryProps) {
  const isCurrent = !!watch?.(`parsedData.education.${index}.isCurrent`);

  return (
    <div key={field.field_id || field.id || `education-${index}`} className="p-3 border rounded-md space-y-2 bg-muted/30 relative">
      <EducationTextFields index={index} register={register} />

      <EducationDateRow
        index={index}
        labelPrefix="Start"
        monthPath={`parsedData.education.${index}.startMonth`}
        setValue={setValue}
        watch={watch}
        yearPath={`parsedData.education.${index}.startYear`}
      />

      <EducationDateRow
        disabled={isCurrent}
        index={index}
        labelPrefix="End"
        monthPath={`parsedData.education.${index}.endMonth`}
        setValue={setValue}
        watch={watch}
        yearPath={`parsedData.education.${index}.endYear`}
      />

      <label>
        <input type="checkbox" {...register?.(`parsedData.education.${index}.isCurrent`)} /> Present
      </label>
      <Input placeholder="GPA" {...register?.(`parsedData.education.${index}.GPA`)} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-7 w-7"
        onClick={() => removeEducation?.(index)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function EducationTextFields({
  index,
  register,
}: Pick<EducationEditEntryProps, 'index' | 'register'>) {
  return (
    <>
      <Input placeholder="University" {...register?.(`parsedData.education.${index}.university`)} />
      <Input placeholder="Major" {...register?.(`parsedData.education.${index}.major`)} />
      <Input placeholder="Field" {...register?.(`parsedData.education.${index}.field`)} />
      <Input placeholder="Campus" {...register?.(`parsedData.education.${index}.campus`)} />
    </>
  );
}

function EducationDateRow({
  disabled,
  labelPrefix,
  monthPath,
  setValue,
  watch,
  yearPath,
}: {
  disabled?: boolean;
  index: number;
  labelPrefix: 'End' | 'Start';
  monthPath: `parsedData.education.${number}.${'endMonth' | 'startMonth'}`;
  setValue?: UseFormSetValue<EditApplicantFormValues>;
  watch?: UseFormWatch<EditApplicantFormValues>;
  yearPath: `parsedData.education.${number}.${'endYear' | 'startYear'}`;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label className="text-xs">{labelPrefix} Month</Label>
        <EducationMonthSelect
          value={watch?.(monthPath)?.toString() || ''}
          onValueChange={(value) => setValue?.(monthPath, value)}
          disabled={disabled}
        />
      </div>
      <div>
        <Label className="text-xs">{labelPrefix} Year</Label>
        <EducationYearSelect
          value={watch?.(yearPath)?.toString() || ''}
          onValueChange={(value) => setValue?.(yearPath, value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function EducationMonthSelect({
  value,
  onValueChange,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Month" />
      </SelectTrigger>
      <SelectContent>
        {EDUCATION_MONTHS.map((monthName, index) => (
          <SelectItem key={monthName} value={(index + 1).toString()}>
            {monthName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EducationYearSelect({
  value,
  onValueChange,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Year" />
      </SelectTrigger>
      <SelectContent>
        {yearRange.map((year) => (
          <SelectItem key={year} value={year}>{year}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
