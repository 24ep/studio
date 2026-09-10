"use client";

import { CustomFieldInput } from '@/components/custom-fields/CustomFieldInput';
import { useCustomFieldDefinitions } from '@/components/custom-fields/use-custom-field-definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { CustomFieldValue, CustomFieldValues } from '@/lib/types';

interface HeadcountCustomFieldsProps {
  customFields: CustomFieldValues;
  onCustomFieldsChange: (customFields: CustomFieldValues) => void;
  positionId: string;
}

export function HeadcountCustomFields({
  customFields,
  onCustomFieldsChange,
}: HeadcountCustomFieldsProps) {
  const { error, fieldDefinitions, loading } = useCustomFieldDefinitions({
    modelName: 'Headcount',
    section: 'details',
  });

  const handleFieldChange = (fieldCode: string, value: CustomFieldValue) => {
    onCustomFieldsChange({
      ...customFields,
      [fieldCode]: value,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Custom Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (fieldDefinitions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Fields</CardTitle>
        <CardDescription>
          Additional information specific to this headcount
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fieldDefinitions.map((definition) => (
          <div key={definition.id} className="space-y-2">
            <Label htmlFor={`custom_${definition.field_code}`}>
              {definition.label}
              {definition.is_required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <CustomFieldInput
              customFields={customFields}
              definition={definition}
              onFieldChange={handleFieldChange}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
