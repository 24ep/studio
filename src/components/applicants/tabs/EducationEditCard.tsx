import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircleIcon as PlusCircle } from '@heroicons/react/24/outline';
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';
import { createEducationDefaults } from './education-tab-utils';
import { EducationEditEntry } from './EducationEditCardParts';
import type { ApplicantFormArrayField } from './EducationTabTypes';

interface EducationEditCardProps {
  register?: UseFormRegister<EditApplicantFormValues>;
  watch?: UseFormWatch<EditApplicantFormValues>;
  setValue?: UseFormSetValue<EditApplicantFormValues>;
  educationFields: ApplicantFormArrayField[];
  appendEducation?: (value: unknown) => void;
  removeEducation?: (index: number) => void;
}

export function EducationEditCard({
  register,
  watch,
  setValue,
  educationFields,
  appendEducation,
  removeEducation,
}: EducationEditCardProps) {
  const handleAddEducation = () => appendEducation?.(createEducationDefaults());

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle>Education</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {educationFields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No education entries yet.</p>
            <p className="text-sm">Click "Add Education" to add your first entry.</p>
          </div>
        ) : (
          educationFields.map((field, index) => (
            <EducationEditEntry
              key={field.field_id || field.id || `education-${index}`}
              field={field}
              index={index}
              register={register}
              watch={watch}
              setValue={setValue}
              removeEducation={removeEducation}
            />
          ))
        )}
        <Button
          type="button"
          variant="outline"
          className="mt-2"
          onClick={handleAddEducation}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add Education
        </Button>
      </CardContent>
    </Card>
  );
}
