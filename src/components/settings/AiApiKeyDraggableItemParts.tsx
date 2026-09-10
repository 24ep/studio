"use client";

import { Check, CheckCircle, Clock, Edit2, RefreshCw, Trash2, X, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  formatApiKey,
  getApiKeyStatusText,
  type AiModelOption,
  type ApiKey,
} from "./ai-api-keys-utils";

export function ApiKeyStatusSummary({ apiKey }: { apiKey: ApiKey }) {
  return (
    <div className="flex items-center gap-2">
      <ApiKeyStatusIcon apiKey={apiKey} />
      <Badge variant={apiKey.priority === 1 ? "default" : "secondary"}>
        Priority {apiKey.priority}
      </Badge>
    </div>
  );
}

function ApiKeyStatusIcon({ apiKey }: { apiKey: ApiKey }) {
  if (apiKey.errorCount > 0) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }

  if (apiKey.lastUsed) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }

  return <Clock className="h-4 w-4 text-gray-400" />;
}

interface ApiKeyValueEditorProps {
  apiKey: ApiKey;
  editValue: string;
  isEditing: boolean;
  onCancelEditing: () => void;
  onEditValueChange: (value: string) => void;
  onSaveEditing: () => void;
}

export function ApiKeyValueEditor({
  apiKey,
  editValue,
  isEditing,
  onCancelEditing,
  onEditValueChange,
  onSaveEditing,
}: ApiKeyValueEditorProps) {
  if (!isEditing) {
    return (
      <div className="font-mono text-sm">
        {formatApiKey(apiKey.key)}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="password"
        value={editValue}
        onChange={(event) => onEditValueChange(event.target.value)}
        className="font-mono text-sm"
        placeholder="Enter new API key"
      />
      <Button
        size="sm"
        onClick={onSaveEditing}
        className="h-8 px-2"
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onCancelEditing}
        className="h-8 px-2"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function ApiKeyStatusText({ apiKey }: { apiKey: ApiKey }) {
  return (
    <>
      <div className="text-xs text-muted-foreground">
        {getApiKeyStatusText(apiKey)}
      </div>
      {apiKey.lastError && (
        <div className="mt-1 text-xs text-red-600">
          Last error: {apiKey.lastError}
        </div>
      )}
    </>
  );
}

interface ApiKeyModelSelectProps {
  apiKey: ApiKey;
  availableModels: AiModelOption[];
  isFetchingModels: boolean;
  providerDefaultModel: string;
  providerLabel: string;
  onModelChange: (apiKey: ApiKey, model: string) => void;
}

export function ApiKeyModelSelect({
  apiKey,
  availableModels,
  isFetchingModels,
  providerDefaultModel,
  providerLabel,
  onModelChange,
}: ApiKeyModelSelectProps) {
  return (
    <div className="mt-2">
      <Label htmlFor={`model-${apiKey.priority}`} className="text-xs">
        AI Model
      </Label>
      <Select
        value={apiKey.selectedModel || providerDefaultModel}
        onValueChange={(value) => onModelChange(apiKey, value)}
      >
        <SelectTrigger id={`model-${apiKey.priority}`} className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {isFetchingModels ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading models...</div>
          ) : availableModels && availableModels.length > 0 ? (
            availableModels.map((model) => (
              <SelectItem key={model.name} value={model.name}>
                {model.displayName}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">{`No ${providerLabel} models available. Please configure valid API keys.`}</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

interface ApiKeyRowActionsProps {
  apiKey: ApiKey;
  deletingKey: number | null;
  isEditing: boolean;
  onRemoveApiKey: (priority: number) => void;
  onStartEditing: (apiKey: ApiKey) => void;
}

export function ApiKeyRowActions({
  apiKey,
  deletingKey,
  isEditing,
  onRemoveApiKey,
  onStartEditing,
}: ApiKeyRowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {!isEditing && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStartEditing(apiKey)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRemoveApiKey(apiKey.priority)}
        disabled={deletingKey === apiKey.priority}
      >
        {deletingKey === apiKey.priority ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
