import { PlusCircleIcon as PlusCircle, TrashIcon as Trash2 } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  buildExperienceYearRange,
  createExperienceDefaults,
  EXPERIENCE_MONTHS,
} from './experience-tab-utils';
import type { ApplicantFormArrayField, ExperienceTabProps } from './ExperienceTabTypes';

const yearRange = buildExperienceYearRange();

interface ExperienceTabEditProps {
  experienceFields: ApplicantFormArrayField[];
  register: ExperienceTabProps['register'];
  watch: ExperienceTabProps['watch'];
  setValue: ExperienceTabProps['setValue'];
  appendExperience?: (value: unknown) => void;
  removeExperience?: (index: number) => void;
}

export function ExperienceTabEdit({
  experienceFields,
  register,
  watch,
  setValue,
  appendExperience,
  removeExperience,
}: ExperienceTabEditProps) {
  const handleAddExperience = () => {
    appendExperience?.(createExperienceDefaults());
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {experienceFields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No work experience entries yet.</p>
              <p className="text-sm">Click "Add Experience" to add your first entry.</p>
            </div>
          ) : (
            experienceFields.map((field, index) => (
              <ExperienceEditEntry
                key={field.field_id || field.id || `experience-${index}`}
                index={index}
                register={register}
                watch={watch}
                setValue={setValue}
                onRemove={removeExperience}
              />
            ))
          )}
          <Button type="button" variant="outline" className="mt-2" onClick={handleAddExperience}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ExperienceEditEntry({
  index,
  register,
  watch,
  setValue,
  onRemove,
}: {
  index: number;
  register: ExperienceTabProps['register'];
  watch: ExperienceTabProps['watch'];
  setValue: ExperienceTabProps['setValue'];
  onRemove?: (index: number) => void;
}) {
  const isCurrent = !!watch?.(`parsedData.experience.${index}.isCurrent`);

  return (
    <div className="p-3 border rounded-md space-y-2 bg-muted/30 relative">
      <Input placeholder="Company" {...register?.(`parsedData.experience.${index}.company`)} />
      <Input placeholder="Position" {...register?.(`parsedData.experience.${index}.position`)} />
      <Textarea placeholder="Description" {...register?.(`parsedData.experience.${index}.description`)} />

      <ExperienceDateSelectRow
        index={index}
        prefix="start"
        watch={watch}
        setValue={setValue}
      />
      <ExperienceDateSelectRow
        index={index}
        prefix="end"
        disabled={isCurrent}
        watch={watch}
        setValue={setValue}
      />
      <label>
        <input type="checkbox" {...register?.(`parsedData.experience.${index}.isCurrent`)} /> Present
      </label>
      <Input placeholder="Position Level" {...register?.(`parsedData.experience.${index}.positionLevel`)} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-7 w-7"
        onClick={() => onRemove?.(index)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function ExperienceDateSelectRow({
  index,
  prefix,
  disabled = false,
  watch,
  setValue,
}: {
  index: number;
  prefix: 'start' | 'end';
  disabled?: boolean;
  watch: ExperienceTabProps['watch'];
  setValue: ExperienceTabProps['setValue'];
}) {
  const labelPrefix = prefix === 'start' ? 'Start' : 'End';
  const monthPath = `parsedData.experience.${index}.${prefix}Month` as const;
  const yearPath = `parsedData.experience.${index}.${prefix}Year` as const;

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <Label className="text-xs">{labelPrefix} Month</Label>
        <Select
          value={watch?.(monthPath)?.toString() || ''}
          onValueChange={(value) => setValue?.(monthPath, value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <SelectItem key={month} value={month.toString()}>
                {EXPERIENCE_MONTHS[month - 1]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">{labelPrefix} Year</Label>
        <Select
          value={watch?.(yearPath)?.toString() || ''}
          onValueChange={(value) => setValue?.(yearPath, value)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {yearRange.map((year: string) => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
