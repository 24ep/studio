import { AlertCircle, Brain, CheckCircle, Loader2, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { GeminiModel } from './ai-configuration-utils';

export function AiConfigurationHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">AI Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure AI model selection and system prompts
        </p>
      </div>
    </div>
  );
}

export function AiConfigurationError({ error }: { error: string }) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

interface AiModelSelectionCardProps {
  availableModels: GeminiModel[];
  currentModel: GeminiModel | null;
  selectedModel: string;
  onSelectedModelChange: (value: string) => void;
}

export function AiModelSelectionCard({
  availableModels,
  currentModel,
  selectedModel,
  onSelectedModelChange,
}: AiModelSelectionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Model Selection
        </CardTitle>
        <CardDescription>
          Choose the Gemini model for AI-powered features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="model-select">AI Model</Label>
          <Select value={selectedModel} onValueChange={onSelectedModelChange}>
            <SelectTrigger id="model-select">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.name} value={model.name}>
                  <div className="flex items-center gap-2">
                    <span>{model.displayName}</span>
                    <Badge variant="secondary" className="text-xs">
                      {model.name}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentModel && (
          <div className="rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">{currentModel.displayName}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {currentModel.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {currentModel.supportedGenerationMethods.map((method) => (
                <Badge key={method} variant="outline" className="text-xs">
                  {method}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AiSearchSystemPromptCardProps {
  systemPrompt: string;
  onSystemPromptChange: (value: string) => void;
}

export function AiSearchSystemPromptCard({
  systemPrompt,
  onSystemPromptChange,
}: AiSearchSystemPromptCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          AI Search System Prompt
        </CardTitle>
        <CardDescription>
          Customize the system prompt for AI-powered Applicant search
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="system-prompt">System Prompt</Label>
          <Textarea
            id="system-prompt"
            placeholder="Enter the system prompt for AI search..."
            value={systemPrompt}
            onChange={(event) => onSystemPromptChange(event.target.value)}
            rows={8}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This prompt will be used to guide the AI when searching for Applicants.
            Leave empty to use the default prompt.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface AiConfigurationSaveButtonProps {
  isLoading: boolean;
  isSaving: boolean;
  onSave: () => void;
}

export function AiConfigurationSaveButton({
  isLoading,
  isSaving,
  onSave,
}: AiConfigurationSaveButtonProps) {
  return (
    <div className="flex justify-end">
      <Button
        onClick={onSave}
        disabled={isSaving || isLoading}
        className="min-w-[120px]"
      >
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          'Save Configuration'
        )}
      </Button>
    </div>
  );
}
