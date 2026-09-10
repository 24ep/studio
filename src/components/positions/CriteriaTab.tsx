"use client";

import React from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TiptapEditorWithExpand } from '@/components/ui/wysiwyg-editors';
import { PositionCustomFieldDisplay } from './PositionCustomFieldDisplay';
import { PositionCustomFieldEdit } from './PositionCustomFieldEdit';
import { cn, sanitizeHtml, sanitizeRichHtml } from '@/lib/utils';
import { Edit, Loader2, Save, XCircle, Target } from 'lucide-react';
import type { CustomFieldValue, Position } from '@/lib/types';
import type { EditPositionFormValues } from './position-edit-form';

interface CriteriaTabProps {
  position: Position;
  isEditMode: boolean;
  isSaving: boolean;
  isDrawerReady: boolean;
  defaultMatchCriteria: string;
  form: UseFormReturn<EditPositionFormValues>;
  isMobile: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: EditPositionFormValues) => Promise<void>;
  onUseDefaultCriteria: () => void;
  onCustomFieldChange: (fieldCode: string, value: CustomFieldValue) => void;
}

export function CriteriaTab({
  position,
  isEditMode,
  isSaving,
  isDrawerReady,
  defaultMatchCriteria,
  form,
  isMobile,
  onEdit,
  onCancel,
  onSave,
  onUseDefaultCriteria,
  onCustomFieldChange,
}: CriteriaTabProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto", isMobile ? "p-4 pb-0" : "p-6")}>
      <ScrollArea className="h-full">
        <div className={cn("space-y-6", isMobile && "pb-40")}>
          <div className="flex items-start justify-between">
            <div />
            {!isEditMode ? (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={onUseDefaultCriteria} disabled={!defaultMatchCriteria}>
                  <Target className="h-4 w-4 mr-2" />
                  Set to Default
                </Button>
                {!defaultMatchCriteria && (
                  <div className="text-xs text-muted-foreground flex items-center">
                    (No default criteria set in system settings)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Match Criteria Content */}
          <div className={cn("border rounded-lg", isMobile ? "p-4" : "p-6")}>
            {isEditMode ? (
              <Controller
                name="matchCriteria"
                control={form.control}
                render={({ field }) => (
                  <div className="flex-1 flex flex-col min-h-0">
                    <TiptapEditorWithExpand
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder="Enter match criteria..."
                      className="flex-1 min-h-[300px]"
                      isOpen={isDrawerReady}
                      expandTitle="Edit Match Criteria"
                    />
                  </div>
                )}
              />
            ) : (
              position.matchCriteria ? (
                <div
                  className="wysiwyg-content prose prose-base max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(position.matchCriteria) }}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">
                    <div className="text-4xl mb-4"><Target className="h-10 w-10 mx-auto" /></div>
                    <h3 className="text-lg font-medium mb-2">No match criteria defined</h3>
                    <p className="text-sm">Click Edit to add match criteria for this position.</p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Form Submit Buttons for Criteria Tab */}
          {isEditMode && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={form.handleSubmit(onSave)} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Custom Fields for Criteria Section */}
      <div className="p-6">
        {isEditMode ? (
          <PositionCustomFieldEdit
            section="criteria"
            positionId={position?.id || ''}
            customFields={position?.customFields || {}}
            onFieldChange={onCustomFieldChange}
            title="Additional Criteria Information"
          />
        ) : (
          <PositionCustomFieldDisplay
            section="criteria"
            positionId={position?.id || ''}
            customFields={position?.customFields || {}}
            title="Additional Criteria Information"
          />
        )}
      </div>
    </div>
  );
}

