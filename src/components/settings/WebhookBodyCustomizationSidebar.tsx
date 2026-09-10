import { Code, Layers, Plus, Settings, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { WebhookBodyCustomizationController } from './use-webhook-body-customization';

interface WebhookBodyCustomizationSidebarProps {
  controller: WebhookBodyCustomizationController;
  webhookEvents: string[];
}

export function WebhookBodyCustomizationSidebar({
  controller,
  webhookEvents,
}: WebhookBodyCustomizationSidebarProps) {
  const {
    addEventConfig,
    bodyConfigs,
    customPayload,
    includeMetadata,
    removeEventConfig,
    selectedEvent,
    setCustomPayload,
    setIncludeMetadata,
    setSelectedEvent,
  } = controller;

  return (
    <div className="w-full lg:w-1/3 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 border-r border-border flex flex-col">
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Global Settings
          </h3>

          <div className="space-y-4">
            <SwitchSetting
              checked={customPayload}
              description="Use custom payload structure"
              label="Custom Payload"
              onChange={setCustomPayload}
            />
            <SwitchSetting
              checked={includeMetadata}
              description="Include webhook metadata"
              label="Include Metadata"
              onChange={setIncludeMetadata}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-green-600" />
            Event Configurations
          </h3>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {webhookEvents.map((eventType) => (
              <WebhookBodyEventCard
                key={eventType}
                eventType={eventType}
                hasConfig={!!bodyConfigs[eventType]}
                isSelected={selectedEvent === eventType}
                onAdd={() => addEventConfig(eventType)}
                onRemove={() => removeEventConfig(eventType)}
                onSelect={() => setSelectedEvent(eventType)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SwitchSetting({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
      <div>
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function WebhookBodyEventCard({
  eventType,
  hasConfig,
  isSelected,
  onAdd,
  onRemove,
  onSelect,
}: {
  eventType: string;
  hasConfig: boolean;
  isSelected: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all',
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
          : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700',
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{eventType}</p>
          <div className="flex items-center gap-2 mt-1">
            {hasConfig ? (
              <Badge variant="default" className="text-xs">
                <Code className="h-3 w-3 mr-1" />
                Custom
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Default
              </Badge>
            )}
          </div>
        </div>
        {!hasConfig ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onAdd();
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add custom configuration</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove custom configuration</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
