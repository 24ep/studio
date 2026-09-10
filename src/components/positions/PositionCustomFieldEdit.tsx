"use client";

import { ArrowPathIcon as Loader2 } from '@heroicons/react/24/outline';

import { CustomFieldInput } from '@/components/custom-fields/CustomFieldInput';
import { useCustomFieldDefinitions } from '@/components/custom-fields/use-custom-field-definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import type { CustomFieldValue, CustomFieldValues } from '@/lib/types';

interface PositionCustomFieldEditProps {
  section: string;
  positionId: string;
  customFields: CustomFieldValues;
  onFieldChange: (fieldCode: string, value: CustomFieldValue) => void;
  title?: string;
  className?: string;
}

export function PositionCustomFieldEdit({
  section,
  customFields = {},
  onFieldChange,
  title = "Custom Fields",
  className = "",
}: PositionCustomFieldEditProps) {
  const { error, fieldDefinitions, loading } = useCustomFieldDefinitions({
    modelName: 'Position',
    section,
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
      <CardContent className="space-y-0 p-0">
        <div className="bg-muted/20 p-4 rounded-lg border border-border/50 space-y-2">
          {fieldDefinitions.map((definition) => (
            <div key={definition.field_code} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 py-3 border-b border-border/30 last:border-0">
              <Label htmlFor={`custom_${definition.field_code}`} className="md:w-1/3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {definition.label}
                {definition.is_required && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              <div className="flex-1">
                <CustomFieldInput
                  customFields={customFields}
                  definition={definition}
                  onFieldChange={onFieldChange}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
