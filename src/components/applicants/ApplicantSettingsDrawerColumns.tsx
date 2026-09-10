"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { Bars3Icon as GripVertical } from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ApplicantSettings } from './applicant-settings-types';
import {
  getApplicantSettingsColumn,
  shouldShowApplicantSettingsColumn,
} from './applicant-settings-drawer-utils';

interface ApplicantSettingsDrawerColumnsProps {
  settings: ApplicantSettings;
  isJobMatchEnabled: boolean;
  onSettingChange: (key: keyof ApplicantSettings, value: boolean | string | number) => void;
  onDragEnd: (result: DropResult) => void;
}

export function ApplicantSettingsDrawerColumns({
  settings,
  isJobMatchEnabled,
  onSettingChange,
  onDragEnd,
}: ApplicantSettingsDrawerColumnsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Table Columns</CardTitle>
        <CardDescription>
          Choose which columns to display and drag to reorder them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="columns">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {settings.columnOrder.map((columnKey, index) => {
                  const column = getApplicantSettingsColumn(columnKey);
                  if (!column || !shouldShowApplicantSettingsColumn(column.key, isJobMatchEnabled)) {
                    return null;
                  }

                  return (
                    <Draggable key={column.key} draggableId={column.key} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${snapshot.isDragging
                            ? 'bg-primary/10 border-primary shadow-md'
                            : 'bg-background border-border hover:bg-muted/50'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <Label htmlFor={column.settingKey} className="text-sm font-medium cursor-pointer">
                              {column.label}
                            </Label>
                          </div>
                          <Switch
                            id={column.settingKey}
                            checked={settings[column.settingKey] as boolean}
                            onCheckedChange={(checked) => onSettingChange(column.settingKey, checked)}
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}
