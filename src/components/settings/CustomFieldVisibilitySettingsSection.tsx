import { Filter } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import type { CustomFieldFormValues } from './CustomFieldModalSchema';
import type {
  CustomFieldSectionProps,
  CustomFieldVisibilitySettingsSectionProps,
} from './CustomFieldModalSectionTypes';

const COMMON_VISIBILITY_OPTIONS = [
  ['showInFilter', 'Show in Filter', 'Display this field in list filters'],
  ['showInApplicantDetail', 'Show in Applicant Detail', 'Display in Applicant detail view'],
  ['showInFullApplicantDetail', 'Show in Full Applicant Detail', 'Display in full Applicant detail page'],
  ['showInTaskBoardFilter', 'Show in Task Board Filter', 'Display in task board filters'],
] as const;

type VisibilityFieldName = keyof Pick<
  CustomFieldFormValues,
  | 'showInFilter'
  | 'showInApplicantDetail'
  | 'showInFullApplicantDetail'
  | 'showInTaskBoardFilter'
  | 'showInPositionSettings'
  | 'showInHeadcountDetail'
>;

function VisibilityCheckbox({
  control,
  name,
  label,
  description,
}: CustomFieldSectionProps & {
  name: VisibilityFieldName;
  label: string;
  description: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>{label}</FormLabel>
            <FormDescription>{description}</FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
}

export function CustomFieldVisibilitySettingsSection({
  control,
  modelName,
}: CustomFieldVisibilitySettingsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Visibility Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {COMMON_VISIBILITY_OPTIONS.map(([name, label, description]) => (
            <VisibilityCheckbox
              key={name}
              control={control}
              name={name}
              label={label}
              description={description}
            />
          ))}

          {modelName === 'Position' && (
            <VisibilityCheckbox
              control={control}
              name="showInPositionSettings"
              label="Show in Position Settings"
              description="Display in position settings page"
            />
          )}

          {modelName === 'Headcount' && (
            <VisibilityCheckbox
              control={control}
              name="showInHeadcountDetail"
              label="Show in Headcount Detail"
              description="Display in headcount detail view"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
