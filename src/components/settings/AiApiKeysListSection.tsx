"use client";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { Key } from "lucide-react";

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AiApiKeyDraggableItem } from "./AiApiKeyDraggableItem";
import type { AiApiKeysAccordionProps } from "./AiApiKeysTabTypes";

export function AiApiKeysListSection({
  apiKeys,
  availableModels,
  deletingKey,
  editingKey,
  editValue,
  isFetchingModels,
  providerDefaultModel,
  providerLabel,
  actions,
}: AiApiKeysAccordionProps) {
  return (
    <AccordionItem value="list" className="border-b">
      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <div className="text-left">
            <div className="font-semibold">{`Configured ${providerLabel} API Keys`}</div>
            <div className="text-xs text-muted-foreground font-normal">
              This priority order applies only to {providerLabel}. Drag to reorder; priority 1 is tried first.
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 pt-2">
        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {`No ${providerLabel} API keys configured. Use Add New API Key to create your first one.`}
          </div>
        ) : (
          <DragDropContext onDragEnd={actions.handleDragEnd}>
            <Droppable droppableId="api-keys">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {apiKeys.map((apiKey, index) => (
                    <AiApiKeyDraggableItem
                      key={`${apiKey.priority}-${apiKey.key.substring(0, 8)}`}
                      draggableId={`${apiKey.priority}-${apiKey.key.substring(0, 8)}`}
                      index={index}
                      apiKey={apiKey}
                      editingKey={editingKey}
                      editValue={editValue}
                      deletingKey={deletingKey}
                      availableModels={availableModels}
                      isFetchingModels={isFetchingModels}
                      providerDefaultModel={providerDefaultModel}
                      providerLabel={providerLabel}
                      onEditValueChange={actions.setEditValue}
                      onSaveEditing={actions.saveEditing}
                      onCancelEditing={actions.cancelEditing}
                      onStartEditing={actions.startEditing}
                      onRemoveApiKey={actions.removeApiKey}
                      onModelChange={actions.handleModelChange}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
