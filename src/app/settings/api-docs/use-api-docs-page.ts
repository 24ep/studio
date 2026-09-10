'use client';

import { useEffect, useMemo, useState } from 'react';
import { readJsonOrFallback } from '@/lib/response-json';
import {
  filterOpenApiSpecByTag,
  getAvailableOpenApiTags,
  type OpenApiSpec,
  type OpenApiTag,
  type SwaggerSpecState,
} from './api-docs-utils';

export function useApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState<SwaggerSpecState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [availableTags, setAvailableTags] = useState<OpenApiTag[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchSwaggerSpec = async () => {
      try {
        const [serversResponse, specResponse] = await Promise.all([
          fetch('/api-docs/servers').then((res) => readJsonOrFallback<unknown>(res, [])),
          fetch('/api-docs').then((res) => readJsonOrFallback<OpenApiSpec>(res, {})),
        ]);

        if (!isMounted) {
          return;
        }

        setSwaggerSpec({ servers: serversResponse, spec: specResponse });
        setAvailableTags(getAvailableOpenApiTags(specResponse));
      } catch (err) {
        console.error('Failed to fetch Swagger spec:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
      }
    };

    fetchSwaggerSpec();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSpec = useMemo(
    () => filterOpenApiSpecByTag(swaggerSpec, selectedTag),
    [selectedTag, swaggerSpec]
  );

  return {
    availableTags,
    error,
    filteredSpec,
    selectedTag,
    setSelectedTag,
    swaggerSpec,
  };
}
