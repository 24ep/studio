import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Controller } from 'react-hook-form';
import type {
  Control,
  FieldPath,
  UseFormRegister,
} from 'react-hook-form';
import type { EditApplicantFormValues } from '../hooks/use-applicant-detail-edit-form';

interface ApplicantInfoFormFieldProps {
  name: FieldPath<EditApplicantFormValues>;
  label: string;
  placeholder: string;
  register?: UseFormRegister<EditApplicantFormValues>;
  control?: Control<EditApplicantFormValues>;
  error?: string | null;
  type?: string;
  multiline?: boolean;
}

function getInputDisplayValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? value : '';
}

export function ApplicantInfoFormField({
  name,
  label,
  placeholder,
  register,
  control,
  error,
  type = 'text',
  multiline = false,
}: ApplicantInfoFormFieldProps) {
  const inputClassName = multiline ? 'mt-1 min-h-[100px]' : 'mt-1';
  const registeredField = register?.(name);

  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      {control ? (
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            const value = getInputDisplayValue(field.value);

            return multiline ? (
              <Textarea
                {...field}
                value={value}
                placeholder={placeholder}
                className={inputClassName}
              />
            ) : (
              <Input
                {...field}
                value={value}
                type={type}
                placeholder={placeholder}
                className={inputClassName}
              />
            );
          }}
        />
      ) : multiline ? (
        <Textarea
          {...registeredField}
          placeholder={placeholder}
          className={inputClassName}
        />
      ) : (
        <Input
          {...registeredField}
          type={type}
          placeholder={placeholder}
          className={inputClassName}
        />
      )}
      {error && (
        <p className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
