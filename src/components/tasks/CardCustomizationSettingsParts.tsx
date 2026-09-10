"use client";

import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { TaskBoardPreferences } from '@/hooks/use-user-preferences';
import {
  cardFieldConfigs,
  cardWidthOptions,
  type TaskBoardCardVisibilityKey,
} from './CardCustomizationSettingsConfig';
export {
  CardCustomizationFooter,
  CardCustomizationScrollbarStyle,
  CardCustomizationTabs,
} from './CardCustomizationSettingsLayout';
import { getCurrentTaskBoardCardWidth, getEnabledTaskBoardCardFields } from './card-customization-settings-utils';

interface CardWidthPanelProps {
  onCardWidthChange: (value: string) => void;
  onCustomWidthChange: (value: number[]) => void;
  preferences: TaskBoardPreferences;
}

export function CardWidthPanel({
  onCardWidthChange,
  onCustomWidthChange,
  preferences,
}: CardWidthPanelProps) {
  const currentWidth = getCurrentTaskBoardCardWidth(preferences);

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs font-medium">Width Preset</Label>
        <Select value={preferences.cardWidth} onValueChange={onCardWidthChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cardWidthOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {preferences.cardWidth === 'custom' && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium">Custom Width: {currentWidth}px</Label>
            <Slider
              value={[currentWidth]}
              onValueChange={onCustomWidthChange}
              min={180}
              max={400}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>180px</span>
              <span>400px</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface VisibleFieldsPanelProps {
  onFieldToggle: (fieldKey: TaskBoardCardVisibilityKey, enabled: boolean) => void;
  preferences: TaskBoardPreferences;
}

export function VisibleFieldsPanel({
  onFieldToggle,
  preferences,
}: VisibleFieldsPanelProps) {
  const enabledFields = getEnabledTaskBoardCardFields(preferences);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2">
        {cardFieldConfigs.map(field => {
          const Icon = field.icon;
          const isEnabled = preferences[field.key] === true;

          return (
            <div
              key={field.key}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg border transition-all duration-200',
                isEnabled
                  ? 'bg-primary/5 border-primary/20 shadow-sm'
                  : 'bg-background border-border hover:bg-muted/50'
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className={cn('h-3 w-3', isEnabled ? 'text-primary' : 'text-muted-foreground')} />
                <div className="text-sm font-medium">{field.label}</div>
              </div>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => onFieldToggle(field.key, checked)}
                className="scale-75"
              />
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
        <div>
          <div className="text-sm font-medium">Enabled Fields</div>
          <div className="text-xs text-muted-foreground">
            {enabledFields.length} of {cardFieldConfigs.length} fields visible
          </div>
        </div>
        <div className="flex gap-1">
          {enabledFields.slice(0, 3).map(field => (
            <Badge key={field.key} variant="secondary" className="text-xs">
              {field.label}
            </Badge>
          ))}
          {enabledFields.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{enabledFields.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
