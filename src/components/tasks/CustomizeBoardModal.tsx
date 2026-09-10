import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useEffect } from 'react';
import {
  buildCardFields,
  buildDynamicApplicantFields,
  buildRowAndColumnFields,
  cleanFieldValues,
  getAllPossibleBoardValues,
  getCustomFieldKeys,
  getParsedDataKeys,
} from './customize-board-utils';
import {
  BoardGroupingSection,
  CardFieldsSection,
  CustomizeBoardModalFooter,
  CustomizeBoardModalHeader,
} from './CustomizeBoardModalSections';
import { useCustomizeBoardSave } from './use-customize-board-save';
import { useCustomizeBoardModalState } from './use-customize-board-modal-state';

interface CustomizeBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rowFieldValues?: string[];
  columnFieldValues?: string[];
}

export function CustomizeBoardModal({ open, onOpenChange, rowFieldValues = [], columnFieldValues = [] }: CustomizeBoardModalProps) {
  const cleanRowFieldValues = cleanFieldValues(rowFieldValues);
  const cleanColumnFieldValues = cleanFieldValues(columnFieldValues);
  const {
    applicants,
    columnField,
    initializing,
    loading,
    positions,
    recruiters,
    rowField,
    setColumnField,
    setLoading,
    setRowField,
    setVisibleColumnValues,
    setVisibleFields,
    setVisibleRowValues,
    stages,
    visibleColumnValues,
    visibleFields,
    visibleRowValues,
  } = useCustomizeBoardModalState(open);

  // Always recalculate field options on every render so new Applicants/fields are included
  const customFieldKeys = getCustomFieldKeys(applicants);
  const parsedDataKeys = getParsedDataKeys(applicants);
  const { dynamicApplicantFields, parsedDataFieldObjs } = buildDynamicApplicantFields(customFieldKeys, parsedDataKeys);
  
  // Get all possible values for each field type using actual data
  const getAllPossibleValues = (fieldKey: string, fallbackFieldValues = cleanRowFieldValues) => {
    return getAllPossibleBoardValues({
      applicants,
      cleanRowFieldValues: fallbackFieldValues,
      fieldKey,
      positions,
      recruiters,
      stages,
    });
  };
  
  // Update visible values when data is loaded and fields change
  useEffect(() => {
    if (open && !initializing && (recruiters.length > 0 || positions.length > 0 || stages.length > 0 || applicants.length > 0)) {
      // Only update if we have data and the modal is not initializing
      const rowValues = getAllPossibleValues(rowField);
      const colValues = getAllPossibleValues(columnField, cleanColumnFieldValues);
      
      // Only update if current values are empty or different
      if (visibleRowValues.length === 0 || JSON.stringify(visibleRowValues) !== JSON.stringify(rowValues)) {
        setVisibleRowValues(rowValues);
      }
      if (visibleColumnValues.length === 0 || JSON.stringify(visibleColumnValues) !== JSON.stringify(colValues)) {
        setVisibleColumnValues(colValues);
      }
    }
  }, [rowField, columnField, open, recruiters, positions, stages, applicants, initializing]);

  const rowAndColumnFields = buildRowAndColumnFields(customFieldKeys, parsedDataFieldObjs);
  const cardFields = buildCardFields(rowAndColumnFields, parsedDataFieldObjs);

  // Ensure rowField/columnField are always valid
  useEffect(() => {
    if (!open) return;
    // If current rowField/columnField is not in options, fallback
    if (rowAndColumnFields.length > 0) {
      if (!rowAndColumnFields.some(f => f.key === rowField)) {
        setRowField('status');
      }
      if (!rowAndColumnFields.some(f => f.key === columnField)) {
        setColumnField('recruiterId');
      }
    }
  }, [open, rowAndColumnFields.length]);

  const handleSave = useCustomizeBoardSave({
    columnField,
    onOpenChange,
    rowField,
    setLoading,
    visibleColumnValues,
    visibleFields,
    visibleRowValues,
  });

  const getFieldLabel = (key: string) => {
    return dynamicApplicantFields.find(f => f.key === key)?.label || key;
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh] flex flex-col gap-6 p-0 overflow-visible" dialogId="customize-board-modal">
        <CustomizeBoardModalHeader />
        <div className="flex-1 min-h-0 overflow-visible px-6 py-4 flex flex-col gap-8">
          <BoardGroupingSection
            columnField={columnField}
            disabled={initializing || loading}
            getAllPossibleValues={getAllPossibleValues}
            getFieldLabel={getFieldLabel}
            rowAndColumnFields={rowAndColumnFields}
            rowField={rowField}
            setColumnField={setColumnField}
            setRowField={setRowField}
            setVisibleColumnValues={setVisibleColumnValues}
            setVisibleRowValues={setVisibleRowValues}
            visibleColumnValues={visibleColumnValues}
            visibleRowValues={visibleRowValues}
          />
          <CardFieldsSection
            cardFields={cardFields}
            setVisibleFields={setVisibleFields}
            visibleFields={visibleFields}
          />
        </div>
        <CustomizeBoardModalFooter
          disabled={loading || initializing}
          initializing={initializing}
          loading={loading}
          onCancel={() => onOpenChange(false)}
          onSave={handleSave}
        />
      </DialogContent>
    </Dialog>
  );
}
