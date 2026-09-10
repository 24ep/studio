'use client';

import { useEffect, useState } from 'react';
import { ApiDocsEndpointList } from './ApiDocsEndpointList';
import { ApiDocsSidebar } from './ApiDocsSidebar';
import { ApiDocsErrorPanel, ApiDocsLoadingPanel } from './ApiDocsStatusPanels';
import type { SwaggerSpec } from './api-docs-types';
import {
  getApiDocsEndpointKey,
  getApiDocsEndpointsByTag,
  getApiDocsTags,
} from './api-docs-utils';
import { readJsonOrFallback } from '@/lib/response-json';

export default function ApiDocsUIPage() {
  const [swaggerSpec, setSwaggerSpec] = useState<SwaggerSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSwaggerSpec = async () => {
      try {
        const response = await fetch('/api-docs', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        setSwaggerSpec(await readJsonOrFallback<SwaggerSpec | null>(response, null));
      } catch (err) {
        console.error('Failed to fetch Swagger spec:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
      }
    };

    void fetchSwaggerSpec();
  }, []);

  const toggleEndpoint = (path: string, method: string) => {
    const key = getApiDocsEndpointKey(path, method);
    setExpandedEndpoints((currentEndpoints) => {
      const nextEndpoints = new Set(currentEndpoints);
      if (nextEndpoints.has(key)) {
        nextEndpoints.delete(key);
      } else {
        nextEndpoints.add(key);
      }
      return nextEndpoints;
    });
  };

  if (error) {
    return <ApiDocsErrorPanel error={error} />;
  }

  if (!swaggerSpec) {
    return <ApiDocsLoadingPanel />;
  }

  const tags = getApiDocsTags(swaggerSpec.paths);
  const endpoints = getApiDocsEndpointsByTag(swaggerSpec, selectedTag);

  return (
    <div className="min-h-full bg-[hsl(var(--app-page-background))] text-foreground">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="mb-2 text-3xl font-bold text-foreground">
            {swaggerSpec.info.title} API Documentation
          </h1>
          <p className="text-muted-foreground">{swaggerSpec.info.description}</p>
          <p className="mt-1 text-sm text-muted-foreground">Version: {swaggerSpec.info.version}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <ApiDocsSidebar
            selectedTag={selectedTag}
            tags={tags}
            onSelectTag={setSelectedTag}
          />
          <ApiDocsEndpointList
            endpoints={endpoints}
            expandedEndpoints={expandedEndpoints}
            selectedTag={selectedTag}
            onToggleEndpoint={toggleEndpoint}
          />
        </div>
      </div>
    </div>
  );
}
