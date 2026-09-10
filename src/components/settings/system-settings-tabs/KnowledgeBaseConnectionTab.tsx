"use client";

import { Database, Eye, EyeOff, Link, Timer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SystemSettingsFieldRow } from './SystemSettingsFieldRow';

type KnowledgeBaseConnectionTabProps = {
  serviceDeskKnowledgeBaseUrl: string;
  setServiceDeskKnowledgeBaseUrl: (value: string) => void;
  serviceDeskKnowledgeBaseApiKey: string;
  setServiceDeskKnowledgeBaseApiKey: (value: string) => void;
  serviceDeskKnowledgeBaseCollectionName: string;
  setServiceDeskKnowledgeBaseCollectionName: (value: string) => void;
  serviceDeskKnowledgeBaseRequestTimeoutMs: number;
  setServiceDeskKnowledgeBaseRequestTimeoutMs: (value: number) => void;
  showServiceDeskKnowledgeBaseApiKey: boolean;
  setShowServiceDeskKnowledgeBaseApiKey: (value: boolean) => void;
  isSaving: boolean;
};

export default function KnowledgeBaseConnectionTab({
  serviceDeskKnowledgeBaseUrl,
  setServiceDeskKnowledgeBaseUrl,
  serviceDeskKnowledgeBaseApiKey,
  setServiceDeskKnowledgeBaseApiKey,
  serviceDeskKnowledgeBaseCollectionName,
  setServiceDeskKnowledgeBaseCollectionName,
  serviceDeskKnowledgeBaseRequestTimeoutMs,
  setServiceDeskKnowledgeBaseRequestTimeoutMs,
  showServiceDeskKnowledgeBaseApiKey,
  setShowServiceDeskKnowledgeBaseApiKey,
  isSaving,
}: KnowledgeBaseConnectionTabProps) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        <section className="rounded-md border p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Database className="h-4 w-4" />
            Vector Database Connection
          </h3>
          <div className="space-y-4">
            <SystemSettingsFieldRow
              htmlFor="service-desk-knowledge-base-url"
              label="Qdrant URL"
              description="Point this to the base URL of your Qdrant endpoint, e.g. https://qdrant.example.com."
            >
              <div className="relative">
                <Input
                  id="service-desk-knowledge-base-url"
                  type="url"
                  inputMode="url"
                  value={serviceDeskKnowledgeBaseUrl}
                  onChange={event => setServiceDeskKnowledgeBaseUrl(event.target.value)}
                  placeholder="https://qdrant.example.com"
                  disabled={isSaving}
                  className="pl-9"
                />
                <Link className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </SystemSettingsFieldRow>

            <SystemSettingsFieldRow
              htmlFor="service-desk-knowledge-base-api-key"
              label="Qdrant API Key"
              description="API key used by this workspace to authenticate with Qdrant. Stored as a secret setting."
            >
              <div className="relative">
                <Input
                  id="service-desk-knowledge-base-api-key"
                  type={showServiceDeskKnowledgeBaseApiKey ? 'text' : 'password'}
                  value={serviceDeskKnowledgeBaseApiKey}
                  onChange={event => setServiceDeskKnowledgeBaseApiKey(event.target.value)}
                  placeholder="Your Qdrant API key"
                  disabled={isSaving}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowServiceDeskKnowledgeBaseApiKey(!showServiceDeskKnowledgeBaseApiKey)}
                  disabled={isSaving}
                  aria-label={showServiceDeskKnowledgeBaseApiKey ? 'Hide API key' : 'Show API key'}
                >
                  {showServiceDeskKnowledgeBaseApiKey ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </SystemSettingsFieldRow>

            <SystemSettingsFieldRow
              htmlFor="service-desk-knowledge-base-collection-name"
              label="Collection Name"
              description="The vector collection where service desk knowledge chunks are stored."
            >
              <Input
                id="service-desk-knowledge-base-collection-name"
                value={serviceDeskKnowledgeBaseCollectionName}
                onChange={event => setServiceDeskKnowledgeBaseCollectionName(event.target.value)}
                placeholder="service_desk_knowledge_chunks"
                disabled={isSaving}
              />
            </SystemSettingsFieldRow>

            <SystemSettingsFieldRow
              htmlFor="service-desk-knowledge-base-request-timeout-ms"
              label="Request Timeout (ms)"
              description="Request timeout sent to Qdrant for search and upsert operations. Values below 1000 are treated as 1000."
            >
              <div className="relative">
                <Input
                  id="service-desk-knowledge-base-request-timeout-ms"
                  type="number"
                  min={1000}
                  step={500}
                  value={serviceDeskKnowledgeBaseRequestTimeoutMs}
                  onChange={event => setServiceDeskKnowledgeBaseRequestTimeoutMs(Math.max(1000, Number(event.target.value) || 1000))}
                  placeholder="10000"
                  disabled={isSaving}
                  className="pl-9"
                />
                <Timer className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </SystemSettingsFieldRow>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}
