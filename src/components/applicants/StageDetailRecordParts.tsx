import {
  BookmarkSquareIcon as Save,
  ChatBubbleLeftRightIcon as MessageSquare,
  ClockIcon as Clock,
  PencilSquareIcon as Edit,
  UserIcon as User,
  XMarkIcon as X,
} from "@heroicons/react/24/outline";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TransitionRecord } from "@/lib/types";
import { sanitizeHtml } from "@/lib/utils";
import { TiptapEditor } from "../ui/wysiwyg-editors";
import {
  getStageDetailActorName,
  getStageDetailTimestampLabel,
} from "./stage-detail-modal-utils";

export interface StageDetailRecordCardProps {
  editableNotes: boolean;
  editDate: string;
  editingRecord: string | null;
  editNote: string;
  index: number;
  isUpdating: Set<string>;
  onEditCancel: () => void;
  onEditDateChange: (value: string) => void;
  onEditNoteChange: (value: string) => void;
  onEditStart: (record: TransitionRecord) => void;
  onSaveAll: (recordId: string) => void;
  record: TransitionRecord;
}

export function StageDetailRecordCard({
  record,
  index,
  editableNotes,
  editingRecord,
  editNote,
  editDate,
  isUpdating,
  onEditStart,
  onEditCancel,
  onEditNoteChange,
  onEditDateChange,
  onSaveAll,
}: StageDetailRecordCardProps) {
  const isEditing = editingRecord === record.id;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          Record #{index + 1}
        </Badge>
        {editableNotes && !editingRecord && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditStart(record)}
            className="h-8 px-2"
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <StageDetailRecordEdit
          record={record}
          editNote={editNote}
          editDate={editDate}
          isUpdating={isUpdating}
          onEditCancel={onEditCancel}
          onEditNoteChange={onEditNoteChange}
          onEditDateChange={onEditDateChange}
          onSaveAll={onSaveAll}
        />
      ) : (
        <StageDetailRecordView record={record} />
      )}
    </div>
  );
}

function StageDetailRecordEdit({
  record,
  editNote,
  editDate,
  isUpdating,
  onEditCancel,
  onEditNoteChange,
  onEditDateChange,
  onSaveAll,
}: {
  record: TransitionRecord;
  editNote: string;
  editDate: string;
  isUpdating: Set<string>;
  onEditCancel: () => void;
  onEditNoteChange: (value: string) => void;
  onEditDateChange: (value: string) => void;
  onSaveAll: (recordId: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`note-${record.id}`} className="text-sm font-medium">
          Notes
        </Label>
        <TiptapEditor
          value={editNote}
          onChange={onEditNoteChange}
          placeholder="Enter stage notes..."
          className="min-h-[120px]"
          showToolbar={true}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`date-${record.id}`} className="text-sm font-medium">
          Timestamp
        </Label>
        <Input
          id={`date-${record.id}`}
          type="datetime-local"
          value={editDate}
          onChange={(event) => onEditDateChange(event.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => onSaveAll(record.id)}
          disabled={isUpdating.has(record.id)}
        >
          {isUpdating.has(record.id) ? (
            <div className="mr-1 h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          ) : (
            <Save className="mr-1 h-3 w-3" />
          )}
          Save All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEditCancel}
        >
          <X className="mr-1 h-3 w-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function StageDetailRecordView({ record }: { record: TransitionRecord }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Notes:</span>
        </div>
        <div
          className="prose prose-sm max-w-none rounded-md bg-muted/50 p-3 text-sm dark:prose-invert [&_p]:my-0 [&_p]:inline"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(record.notes || "") }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Updated by:</span>
          </div>
          <div className="text-sm">
            {getStageDetailActorName(record)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Timestamp:</span>
          </div>
          <div className="text-sm">
            {getStageDetailTimestampLabel(record)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StageDetailEmptyState() {
  return (
    <div className="py-8 text-center text-muted-foreground">
      <MessageSquare className="mx-auto mb-4 h-12 w-12 opacity-50" />
      <p>No transition records found for this stage.</p>
    </div>
  );
}
