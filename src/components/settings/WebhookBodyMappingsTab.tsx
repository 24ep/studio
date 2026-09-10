import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { WebhookBodyCustomizationController } from './use-webhook-body-customization';
import type { FieldMapping } from './webhook-body-customization-types';
import {
  WebhookAvailableFieldsPanel,
  WebhookFieldMappingRow,
} from './WebhookBodyMappingsTabParts';

interface WebhookBodyMappingsTabProps {
  controller: WebhookBodyCustomizationController;
}

export function WebhookBodyMappingsTab({ controller }: WebhookBodyMappingsTabProps) {
  const {
    addEventFieldMapping,
    addGlobalFieldMapping,
    availableFields,
    bodyConfigs,
    globalFieldMappings,
    removeEventFieldMapping,
    removeGlobalFieldMapping,
    selectedEvent,
    updateEventFieldMapping,
    updateGlobalFieldMapping,
  } = controller;
  const mappings = bodyConfigs[selectedEvent]?.field_mappings || globalFieldMappings;
  const isEventConfigured = !!bodyConfigs[selectedEvent];
  const availableEventFields = availableFields[selectedEvent];

  const addMapping = () => {
    if (isEventConfigured) {
      addEventFieldMapping(selectedEvent);
    } else {
      addGlobalFieldMapping();
    }
  };

  const removeMapping = (index: number) => {
    if (isEventConfigured) {
      removeEventFieldMapping(selectedEvent, index);
    } else {
      removeGlobalFieldMapping(index);
    }
  };

  const updateMapping = (index: number, field: keyof FieldMapping, value: unknown) => {
    if (isEventConfigured) {
      updateEventFieldMapping(selectedEvent, index, field, value);
    } else {
      updateGlobalFieldMapping(index, field, value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Field Mappings</CardTitle>
        <CardDescription>
          Map source fields to target fields and apply transformations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Field Mappings</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={addMapping}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Mapping
            </Button>
          </div>

          <div className="space-y-3">
            {mappings.map((mapping, index) => (
              <WebhookFieldMappingRow
                key={index}
                mapping={mapping}
                onRemove={() => removeMapping(index)}
                onUpdate={(field, value) => updateMapping(index, field, value)}
              />
            ))}
          </div>

          {availableEventFields && (
            <WebhookAvailableFieldsPanel fields={availableEventFields} selectedEvent={selectedEvent} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
