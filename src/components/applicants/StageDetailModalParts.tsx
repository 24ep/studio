import type { TransitionRecord } from '@/lib/types';
import {
  StageDetailEmptyState,
  StageDetailRecordCard,
} from './StageDetailRecordParts';
import {
  getStageDetailRecordCountLabel,
} from './stage-detail-modal-utils';

interface StageDetailRecordsListProps {
  records: TransitionRecord[];
  editableNotes: boolean;
  editingRecord: string | null;
  editNote: string;
  editDate: string;
  isUpdating: Set<string>;
  onEditStart: (record: TransitionRecord) => void;
  onEditCancel: () => void;
  onEditNoteChange: (value: string) => void;
  onEditDateChange: (value: string) => void;
  onSaveAll: (recordId: string) => void;
}

export function StageDetailRecordsList(props: StageDetailRecordsListProps) {
  if (props.records.length === 0) {
    return <StageDetailEmptyState />;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {getStageDetailRecordCountLabel(props.records.length)}
      </div>

      {props.records.map((record, index) => (
        <StageDetailRecordCard
          key={record.id}
          {...props}
          record={record}
          index={index}
        />
      ))}
    </div>
  );
}
