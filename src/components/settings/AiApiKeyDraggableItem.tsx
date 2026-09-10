"use client";

import { Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  type AiModelOption,
  type ApiKey,
} from './ai-api-keys-utils';
import {
  ApiKeyModelSelect,
  ApiKeyRowActions,
  ApiKeyStatusSummary,
  ApiKeyStatusText,
  ApiKeyValueEditor,
} from './AiApiKeyDraggableItemParts';

interface AiApiKeyDraggableItemProps {
  apiKey: ApiKey;
  index: number;
  draggableId: string;
  editingKey: string | null;
  editValue: string;
  deletingKey: number | null;
  availableModels: AiModelOption[];
  isFetchingModels: boolean;
  providerDefaultModel: string;
  providerLabel: string;
  onEditValueChange: (value: string) => void;
  onSaveEditing: () => void;
  onCancelEditing: () => void;
  onStartEditing: (apiKey: ApiKey) => void;
  onRemoveApiKey: (priority: number) => void;
  onModelChange: (apiKey: ApiKey, model: string) => void;
}

export function AiApiKeyDraggableItem({
  apiKey,
  index,
  draggableId,
  editingKey,
  editValue,
  deletingKey,
  availableModels,
  isFetchingModels,
  providerDefaultModel,
  providerLabel,
  onEditValueChange,
  onSaveEditing,
  onCancelEditing,
  onStartEditing,
  onRemoveApiKey,
  onModelChange,
}: AiApiKeyDraggableItemProps) {
  const isEditing = editingKey === apiKey.key;

  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "flex items-center justify-between p-4 border rounded-lg",
            apiKey.errorCount > 0 ? "border-red-200 bg-red-50" : "border-border",
            snapshot.isDragging && "shadow-lg border-primary"
          )}
        >
          <div className="flex items-center gap-4">
            <div
              {...provided.dragHandleProps}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <ApiKeyStatusSummary apiKey={apiKey} />
            <div className="flex-1">
              <ApiKeyValueEditor
                apiKey={apiKey}
                editValue={editValue}
                isEditing={isEditing}
                onCancelEditing={onCancelEditing}
                onEditValueChange={onEditValueChange}
                onSaveEditing={onSaveEditing}
              />
              <ApiKeyStatusText apiKey={apiKey} />
              <ApiKeyModelSelect
                apiKey={apiKey}
                availableModels={availableModels}
                isFetchingModels={isFetchingModels}
                providerDefaultModel={providerDefaultModel}
                providerLabel={providerLabel}
                onModelChange={onModelChange}
              />
            </div>
          </div>
          <ApiKeyRowActions
            apiKey={apiKey}
            deletingKey={deletingKey}
            isEditing={isEditing}
            onRemoveApiKey={onRemoveApiKey}
            onStartEditing={onStartEditing}
          />
        </div>
      )}
    </Draggable>
  );
}
