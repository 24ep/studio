"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { DownloadCloud, Edit3, GripVertical, Image as ImageIcon, Loader2, MapPin, PlusCircle, Trash2 } from "lucide-react";

import {
  SettingsEmptyState,
  SettingsLoadingState,
} from "@/components/settings/SettingsTabState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ApplicantSource } from "@/lib/types";

interface ApplicantSourcesTabHeaderProps {
  appKitLoad?: {
    environment: "development" | "production";
    percent: number;
    message: string;
  } | null;
  onCreate: () => void;
  onLoadFromAppKit?: (environment: "development" | "production") => void;
}

export function ApplicantSourcesTabHeader({
  appKitLoad,
  onCreate,
  onLoadFromAppKit,
}: ApplicantSourcesTabHeaderProps) {
  const loadingForDevelopment =
    appKitLoad && appKitLoad.environment === "development" ? appKitLoad : null;
  const loadingForProduction =
    appKitLoad && appKitLoad.environment === "production" ? appKitLoad : null;

  return (
    <div className="flex flex-wrap justify-between items-start gap-3">
      <div>
        <h2 className="text-lg font-semibold">Applicant Sources</h2>
        <p className="text-sm text-muted-foreground">
          Manage Applicant source options and settings for tracking where Applicants come from.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onLoadFromAppKit && (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={!!appKitLoad}
              onClick={() => onLoadFromAppKit("development")}
              className="flex items-center gap-2"
            >
              {loadingForDevelopment ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
              {loadingForDevelopment
                ? `${loadingForDevelopment.percent}% · ${loadingForDevelopment.message}`
                : "Load development sources"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!!appKitLoad}
              onClick={() => onLoadFromAppKit("production")}
              className="flex items-center gap-2"
            >
              {loadingForProduction ? <Loader2 className="h-4 w-4 animate-spin" /> : <DownloadCloud className="h-4 w-4" />}
              {loadingForProduction
                ? `${loadingForProduction.percent}% · ${loadingForProduction.message}`
                : "Load live sources"}
            </Button>
          </>
        )}
        <Button onClick={onCreate} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add Source
        </Button>
      </div>
    </div>
  );
}

interface ApplicantSourcesTabContentProps {
  sources: ApplicantSource[];
  isLoading: boolean;
  onCreate: () => void;
  onEdit: (source: ApplicantSource) => void;
  onDelete: (source: ApplicantSource) => void;
  onDragEnd: (result: DropResult) => void;
}

export function ApplicantSourcesTabContent({
  sources,
  isLoading,
  onCreate,
  onEdit,
  onDelete,
  onDragEnd,
}: ApplicantSourcesTabContentProps) {
  if (isLoading) {
    return <SettingsLoadingState label="Loading sources..." />;
  }

  if (sources.length === 0) {
    return (
      <SettingsEmptyState
        icon={MapPin}
        title="No Applicant Sources"
        description="Create your first Applicant source to get started."
        action={(
          <Button onClick={onCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Create First Source
          </Button>
        )}
      />
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="sources-list">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
            {sources.map((source, index) => (
              <Draggable key={source.id} draggableId={source.id} index={index}>
                {(provided, snapshot) => (
                  <ApplicantSourceDraggableCard
                    source={source}
                    dragProvided={provided}
                    isDragging={snapshot.isDragging}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

interface ApplicantSourceDraggableCardProps {
  source: ApplicantSource;
  dragProvided: Parameters<Parameters<typeof Draggable>[0]["children"]>[0];
  isDragging: boolean;
  onEdit: (source: ApplicantSource) => void;
  onDelete: (source: ApplicantSource) => void;
}

function ApplicantSourceDraggableCard({
  source,
  dragProvided,
  isDragging,
  onEdit,
  onDelete,
}: ApplicantSourceDraggableCardProps) {
  return (
    <Card
      ref={dragProvided.innerRef}
      {...dragProvided.draggableProps}
      className={`transition-all duration-200 ${
        isDragging ? "shadow-lg scale-105" : "hover:shadow-md"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              {...dragProvided.dragHandleProps}
              className="cursor-move text-muted-foreground hover:text-foreground transition-colors"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <ApplicantSourceIdentity source={source} />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(source)}
              className="h-7 w-7"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(source)}
              className="h-7 w-7 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicantSourceIdentity({ source }: { source: ApplicantSource }) {
  return (
    <div className="flex items-center gap-3">
      {source.logo ? (
        <img
          src={source.logo}
          alt={`${source.name} logo`}
          className="h-8 w-8 object-contain rounded-full"
        />
      ) : (
        <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-foreground">{source.name}</h3>
        {source.description && (
          <p className="text-xs text-muted-foreground">{source.description}</p>
        )}
      </div>
    </div>
  );
}
