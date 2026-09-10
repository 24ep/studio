import { Code, Database, Eye, Layers, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { WebhookBodyCustomizationController } from './use-webhook-body-customization';
import { WebhookBodyMappingsTab } from './WebhookBodyMappingsTab';
import { WebhookBodyPreviewTab } from './WebhookBodyPreviewTab';
import { WebhookBodyTemplateTab } from './WebhookBodyTemplateTab';

interface WebhookBodyCustomizationEditorProps {
  controller: WebhookBodyCustomizationController;
}

export function WebhookBodyCustomizationEditor({
  controller,
}: WebhookBodyCustomizationEditorProps) {
  const {
    generatePreview,
    previewLoading,
    selectedEvent,
  } = controller;

  return (
    <div className="w-full lg:w-2/3 p-6 flex flex-col">
      {selectedEvent ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                {selectedEvent}
              </h2>
              <p className="text-sm text-muted-foreground">
                Configure payload structure for this event
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generatePreview}
              disabled={previewLoading}
            >
              {previewLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              ) : (
                <Eye className="h-4 w-4 mr-1" />
              )}
              Preview
            </Button>
          </div>

          <Tabs defaultValue="template" className="space-y-4">
            <TabsList variant="subnav" className="grid w-full grid-cols-3">
              <TabsTrigger value="template" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Template
              </TabsTrigger>
              <TabsTrigger value="mappings" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Field Mappings
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
              <WebhookBodyTemplateTab controller={controller} />
            </TabsContent>
            <TabsContent value="mappings" className="space-y-4">
              <WebhookBodyMappingsTab controller={controller} />
            </TabsContent>
            <TabsContent value="preview" className="space-y-4">
              <WebhookBodyPreviewTab controller={controller} />
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select an event to configure its payload</p>
        </div>
      )}
    </div>
  );
}
