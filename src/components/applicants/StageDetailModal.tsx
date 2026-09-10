"use client";

import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { TransitionRecord } from '@/lib/types';
import { StageDetailRecordsList } from './StageDetailModalParts';
import type { StageDetailModalProps } from './StageDetailModalTypes';
import { getStageDetailEditDateValue } from './stage-detail-modal-utils';

export function StageDetailModal({
  isOpen,
  onOpenChange,
  stage,
  records,
  editableNotes,
  onNoteEdit,
  onTimestampEdit,
  isUpdating,
}: StageDetailModalProps) {
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState('');

  const clearEditState = useCallback(() => {
    setEditingRecord(null);
    setEditNote('');
    setEditDate('');
  }, []);

  const handleEditStart = useCallback((record: TransitionRecord) => {
    setEditingRecord(record.id);
    setEditNote(record.notes || '');
    setEditDate(getStageDetailEditDateValue(record));
  }, []);

  const handleSaveAll = useCallback(async (recordId: string) => {
    try {
      await Promise.all([
        onNoteEdit(recordId, editNote),
        onTimestampEdit(recordId, new Date(editDate).toISOString()),
      ]);
      clearEditState();
      toast.success('Stage details updated successfully');
    } catch (error) {
      console.error('Error updating stage details:', error);
      toast.error('Failed to update stage details');
    }
  }, [clearEditState, editDate, editNote, onNoteEdit, onTimestampEdit]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {stage.name} - Stage Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <StageDetailRecordsList
            records={records}
            editableNotes={editableNotes}
            editingRecord={editingRecord}
            editNote={editNote}
            editDate={editDate}
            isUpdating={isUpdating}
            onEditStart={handleEditStart}
            onEditCancel={clearEditState}
            onEditNoteChange={setEditNote}
            onEditDateChange={setEditDate}
            onSaveAll={handleSaveAll}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
