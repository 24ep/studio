"use client";

import { AlertCircle, Calendar, CheckCircle, Clock, Key, RefreshCw, Trash2, XCircle } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  formatSystemApiKeyDate,
  isSystemApiKeyExpired,
  type SystemApiKey,
} from "./system-api-keys-utils";

interface SystemApiKeysListSectionProps {
  apiKeys: SystemApiKey[];
  deletingId: string | null;
  togglingId: string | null;
  onDeleteClick: (id: string) => void;
  onToggleActive: (apiKey: SystemApiKey) => void;
}

export function SystemApiKeysListSection({
  apiKeys,
  deletingId,
  togglingId,
  onDeleteClick,
  onToggleActive,
}: SystemApiKeysListSectionProps) {
  return (
    <AccordionItem value="list" className="border-b">
      <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <div className="text-left">
            <div className="font-semibold">Configured API Keys ({apiKeys.length})</div>
            <div className="text-xs text-muted-foreground font-normal">
              Manage your system API keys for v2 API authentication
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 pt-2">
        {apiKeys.length === 0 ? (
          <SystemApiKeysEmptyState />
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <SystemApiKeyListItem
                key={apiKey.id}
                apiKey={apiKey}
                deletingId={deletingId}
                togglingId={togglingId}
                onDeleteClick={onDeleteClick}
                onToggleActive={onToggleActive}
              />
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function SystemApiKeysEmptyState() {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No API keys configured yet.</p>
      <p className="text-sm mt-1">Create your first API key to enable external integrations.</p>
    </div>
  );
}

function SystemApiKeyStatusIcon({ apiKey }: { apiKey: SystemApiKey }) {
  if (!apiKey.isActive) {
    return <XCircle className="h-4 w-4 text-red-500" />;
  }

  if (isSystemApiKeyExpired(apiKey)) {
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  }

  if (apiKey.lastUsedAt) {
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  }

  return <Clock className="h-4 w-4 text-gray-400" />;
}

function SystemApiKeyListItem({
  apiKey,
  deletingId,
  togglingId,
  onDeleteClick,
  onToggleActive,
}: {
  apiKey: SystemApiKey;
  deletingId: string | null;
  togglingId: string | null;
  onDeleteClick: (id: string) => void;
  onToggleActive: (apiKey: SystemApiKey) => void;
}) {
  const isExpired = isSystemApiKeyExpired(apiKey);

  return (
    <div
      className={cn(
        "p-4 border rounded-lg",
        !apiKey.isActive ? "border-red-200 bg-red-50/50" :
          isExpired ? "border-yellow-200 bg-yellow-50/50" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SystemApiKeyStatusIcon apiKey={apiKey} />
            <span className="font-medium truncate">{apiKey.name}</span>
            <Badge variant={apiKey.isActive ? "default" : "secondary"}>
              {apiKey.isActive ? "Active" : "Disabled"}
            </Badge>
            {isExpired && <Badge variant="destructive">Expired</Badge>}
          </div>

          {apiKey.description && (
            <p className="text-sm text-muted-foreground mb-2">{apiKey.description}</p>
          )}

          <div className="font-mono text-sm bg-muted px-2 py-1 rounded inline-block">
            {apiKey.maskedKey}
          </div>

          <SystemApiKeyMetadata apiKey={apiKey} isExpired={isExpired} />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor={`toggle-${apiKey.id}`} className="text-xs text-muted-foreground">
              {apiKey.isActive ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id={`toggle-${apiKey.id}`}
              checked={apiKey.isActive}
              onCheckedChange={() => onToggleActive(apiKey)}
              disabled={togglingId === apiKey.id}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteClick(apiKey.id)}
            disabled={deletingId === apiKey.id}
          >
            {deletingId === apiKey.id ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SystemApiKeyMetadata({
  apiKey,
  isExpired,
}: {
  apiKey: SystemApiKey;
  isExpired: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        Created: {formatSystemApiKeyDate(apiKey.createdAt)}
      </span>
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Last used: {apiKey.lastUsedAt ? formatSystemApiKeyDate(apiKey.lastUsedAt) : "Never"}
      </span>
      <span>Usage: {apiKey.usageCount} requests</span>
      {apiKey.expiresAt && (
        <span className={cn(isExpired && "text-red-600 font-medium")}>
          Expires: {formatSystemApiKeyDate(apiKey.expiresAt)}
        </span>
      )}
    </div>
  );
}
