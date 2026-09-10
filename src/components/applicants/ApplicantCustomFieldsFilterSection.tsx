"use client";

import { CircleStackIcon as Database } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CustomFieldFilter } from '@/components/ui/CustomFieldFilter';
import type { ApplicantCustomFieldFilterValue, CustomFieldDefinition } from '@/lib/types';

import { ApplicantFilterSectionHeader } from './ApplicantFilterSectionHeader';

interface ApplicantCustomFieldsFilterSectionProps {
  fields: CustomFieldDefinition[];
  values: Record<string, ApplicantCustomFieldFilterValue>;
  isLoading: boolean;
  disabled?: boolean;
  onReset: () => void;
  onFieldChange: (fieldCode: string, value: ApplicantCustomFieldFilterValue) => void;
}

export function ApplicantCustomFieldsFilterSection({
  fields,
  values,
  isLoading,
  disabled,
  onReset,
  onFieldChange,
}: ApplicantCustomFieldsFilterSectionProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <Accordion type="multiple" defaultValue={[]} className="w-full">
      <AccordionItem value="custom-fields" className="border-b border-border/50">
        <AccordionTrigger className="px-6 py-3 hover:no-underline rounded-none pl-6 pr-6">
          <ApplicantFilterSectionHeader
            icon={<Database className="w-4 h-4 text-muted-foreground" />}
            title="Custom Fields"
            onReset={onReset}
            disabled={disabled || isLoading}
          >
            <Badge variant="secondary" className="text-xs">
              {fields.length}
            </Badge>
          </ApplicantFilterSectionHeader>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 overflow-visible">
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Loading custom fields...</span>
              </div>
            ) : (
              fields.map((field) => (
                <CustomFieldFilter
                  key={field.field_code}
                  definition={field}
                  value={values[field.field_code]}
                  onChange={(value) => onFieldChange(field.field_code, value)}
                  className="w-full"
                />
              ))
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
