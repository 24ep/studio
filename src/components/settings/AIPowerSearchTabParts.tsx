import {
  AlertTriangle,
  BrainCircuit,
  Edit,
  Info,
  Loader2,
  RotateCcw,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function AIPowerSearchInfoAlert() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        <strong>Important:</strong> This system prompt controls how AI Power Search interprets and matches Applicant queries.
        Changes here will affect all AI-powered Applicant searches across the platform.
        The prompt uses placeholders <code className="bg-muted px-1 rounded">{"{query}"}</code> and <code className="bg-muted px-1 rounded">{"{ApplicantData}"}</code>
        which are automatically replaced with actual search queries and Applicant data.
      </AlertDescription>
    </Alert>
  );
}

export function AIPowerSearchConfigTrigger() {
  return (
    <div className="flex items-center gap-2">
      <BrainCircuit className="h-5 w-5 text-primary" />
      <div className="text-left">
        <div className="font-semibold">System Prompt Configuration</div>
        <div className="text-xs text-muted-foreground font-normal">
          Define the exact behavior and matching rules for AI Power Search
        </div>
      </div>
    </div>
  );
}

interface AIPowerSearchPromptActionsProps {
  isEditing: boolean;
  isSaving: boolean;
  onDone: () => void;
  onEdit: () => void;
  onReset: () => void;
}

export function AIPowerSearchPromptActions({
  isEditing,
  isSaving,
  onDone,
  onEdit,
  onReset,
}: AIPowerSearchPromptActionsProps) {
  return (
    <div className="flex justify-end mb-4">
      <div className="flex items-center gap-2">
        {!isEditing ? (
          <Button onClick={onEdit} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit Prompt
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={onReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Default
            </Button>
            {isSaving && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving
              </span>
            )}
            <Button variant="outline" onClick={onDone}>
              Done
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface AIPowerSearchPromptContentProps {
  currentPrompt: string;
  error: string | null;
  isEditing: boolean;
  isLoading: boolean;
  onPromptChange: (prompt: string) => void;
}

export function AIPowerSearchPromptContent({
  currentPrompt,
  error,
  isEditing,
  isLoading,
  onPromptChange,
}: AIPowerSearchPromptContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>System Prompt Content</Label>
        {isEditing ? (
          <Textarea
            value={currentPrompt}
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder="Enter the system prompt content..."
            className="min-h-[600px] font-mono text-sm"
          />
        ) : (
          <div className="border rounded-md p-4 bg-muted/30 min-h-[600px] overflow-auto">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {currentPrompt}
            </pre>
          </div>
        )}
      </div>

      {isEditing && <AIPowerSearchPlaceholderHint />}
    </div>
  );
}

function AIPowerSearchPlaceholderHint() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Info className="h-4 w-4" />
      <span>
        Use <code className="bg-muted px-1 rounded">{"{query}"}</code> for the user's search query and
        <code className="bg-muted px-1 rounded">{"{ApplicantData}"}</code> for the Applicant data.
      </span>
    </div>
  );
}
