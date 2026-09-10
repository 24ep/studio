import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Form } from '@/components/ui/form';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Settings } from 'lucide-react';
import type { CustomFieldDefinition, UserGroup } from '@/lib/types';
import { CustomFieldDrawerTabs } from './CustomFieldDrawerTabs';
import {
  type CustomFieldFormValues,
} from './CustomFieldDrawerParts';
import {
  CustomFieldAdvancedTab,
  CustomFieldBasicTab,
  CustomFieldPermissionsTab,
  CustomFieldVisibilityTab,
} from './CustomFieldDrawerFormTabs';
import { CustomFieldOptionsTab } from './CustomFieldOptionsTab';
import { useCustomFieldDrawerController } from './use-custom-field-drawer-controller';

interface CustomFieldDrawerProps {
  open: boolean;
  definition?: CustomFieldDefinition | null;
  onClose: () => void;
  onSubmit: (data: CustomFieldFormValues) => Promise<void>;
  availableRoles?: UserGroup[];
}

export default function CustomFieldDrawer({ 
  open, 
  definition, 
  onClose, 
  onSubmit, 
  availableRoles = [] 
}: CustomFieldDrawerProps) {
  const isEdit = Boolean(definition);
  const {
    activeTab,
    addOption,
    availableGroups,
    form,
    handleFormSubmit,
    handleSubmit,
    isSelectType,
    isSubmitting,
    optionsFields,
    removeOptionField,
    setActiveTab,
    updateOptionField,
    watchFieldType,
    watchModelName,
    watchShowInApplicantDetail,
    watchShowInFullApplicantDetail,
    watchShowInPositionSettings,
  } = useCustomFieldDrawerController({
    availableRoles,
    definition,
    isEdit,
    onClose,
    onSubmit,
    open,
  });

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        sheetId={`custom-field-drawer-${definition?.id ? definition.id : 'new'}`}
        className="h-full w-[50vw] min-w-[600px] max-w-none flex flex-col"
      >
        <SheetHeader className="border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {isEdit ? 'Edit Custom Field' : 'Create Custom Field'}
          </SheetTitle>
          <SheetDescription>
            Configure custom attributes for {watchModelName.toLowerCase()}s with advanced settings and permissions.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <CustomFieldDrawerTabs
            activeTab={activeTab}
            isSelectType={isSelectType}
            onTabChange={setActiveTab}
          />

          <ScrollArea className="flex-1 min-h-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                
                {/* Basic Information Tab */}
                {activeTab === 'basic' && (
                  <CustomFieldBasicTab
                    form={form}
                    modelName={watchModelName}
                    fieldType={watchFieldType}
                  />
                )}

                {/* Permissions Tab */}
                {activeTab === 'permissions' && (
                  <CustomFieldPermissionsTab form={form} availableGroups={availableGroups} />
                )}

                {/* Visibility Tab */}
                {activeTab === 'visibility' && (
                  <CustomFieldVisibilityTab
                    form={form}
                    modelName={watchModelName}
                    showInFullApplicantDetail={watchShowInFullApplicantDetail}
                    showInApplicantDetail={watchShowInApplicantDetail}
                    showInPositionSettings={watchShowInPositionSettings}
                  />
                )}

                {/* Options Tab - Only for Select/Multiselect types */}
                {activeTab === 'options' && isSelectType && (
                  <CustomFieldOptionsTab
                    control={form.control}
                    optionsFields={optionsFields}
                    onAddOption={addOption}
                    onRemoveOption={removeOptionField}
                    onUpdateOption={updateOptionField}
                  />
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                  <CustomFieldAdvancedTab
                    form={form}
                    modelName={watchModelName}
                    fieldType={watchFieldType}
                    isSelectType={isSelectType}
                    optionsCount={optionsFields.length}
                  />
                )}
              </form>
            </Form>
          </ScrollArea>
        </div>

        <SheetFooter className="border-t flex-shrink-0">
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleFormSubmit} 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : (isEdit ? 'Update Field' : 'Create Field')}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
