"use client";

import { ArrowPathIcon as Loader2 } from '@heroicons/react/24/outline';

import { CustomFieldInput } from '@/components/custom-fields/CustomFieldInput';
import { useCustomFieldDefinitions } from '@/components/custom-fields/use-custom-field-definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { CustomFieldValue, CustomFieldValues } from '@/lib/types';

interface CustomFieldEditProps {
  modelName: 'Applicant' | 'Position' | 'User' | 'Headcount';
  section: string;
  entityId: string;
  customFields: CustomFieldValues;
  onFieldChange: (fieldCode: string, value: CustomFieldValue) => void;
  title?: string;
  className?: string;
  refreshTrigger?: number;
}

export function CustomFieldEdit({
  modelName,
  section,
  customFields = {},
  onFieldChange,
  title = "Custom Fields",
  className = "",
  refreshTrigger,
}: CustomFieldEditProps) {
  const { error, fieldDefinitions, loading } = useCustomFieldDefinitions({
    modelName,
    section,
    refreshTrigger,
  });

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading custom fields...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (fieldDefinitions.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fieldDefinitions.map((definition) => (
          <div key={definition.field_code} className="space-y-2">
            <Label htmlFor={`custom_${definition.field_code}`} className="text-sm font-medium">
              {definition.label}
              {definition.is_required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            <CustomFieldInput
              customFields={customFields}
              definition={definition}
              onFieldChange={onFieldChange}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
