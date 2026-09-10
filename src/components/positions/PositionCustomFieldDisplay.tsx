"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { CustomFieldDefinition, CustomFieldValues } from '@/lib/types';
import { fetchCustomFieldsForSection, renderCustomFieldValue } from '@/lib/customFieldUtils';

interface PositionCustomFieldDisplayProps {
  section: string;
  positionId: string;
  customFields?: CustomFieldValues;
  title?: string;
  className?: string;
}

export function PositionCustomFieldDisplay({ 
  section, 
  positionId, 
  customFields = {}, 
  title = "Custom Fields",
  className = ""
}: PositionCustomFieldDisplayProps) {
  const [fieldDefinitions, setFieldDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFieldDefinitions = async () => {
      try {
        setLoading(true);
        setError(null);
        const fields = await fetchCustomFieldsForSection('Position', section);
        setFieldDefinitions(fields);
      } catch (err) {
        console.error('Failed to load custom field definitions:', err);
        setError('Failed to load custom fields');
      } finally {
        setLoading(false);
      }
    };

    loadFieldDefinitions();
  }, [section]);

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
    return null; // Don't render anything if no custom fields
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="bg-muted/20 p-4 rounded-lg border border-border/50 space-y-0">
          {fieldDefinitions.map((definition) => {
            const value = customFields[definition.field_code];
            
            return (
              <div key={definition.id} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 py-3 border-b border-border/30 last:border-0">
                <label className="md:w-1/3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {definition.label}
                </label>
                <div className="flex-1 text-sm font-bold text-foreground">
                  {renderCustomFieldValue(definition, value)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
