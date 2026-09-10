'use client';

import type { ComponentProps, ComponentType } from 'react';
import dynamic from 'next/dynamic';
import type SwaggerUIComponent from 'swagger-ui-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApiDocsSwaggerTheme } from './ApiDocsSwaggerTheme';
import type { OpenApiSpec, OpenApiTag } from './api-docs-utils';

import 'swagger-ui-react/swagger-ui.css';

type SwaggerUIProps = ComponentProps<typeof SwaggerUIComponent>;

const SwaggerUI = dynamic(
  () => import('swagger-ui-react').then((module) => module.default),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: '20px', color: 'hsl(var(--muted-foreground))' }}>
        Loading interactive API explorer...
      </div>
    ),
  },
) as ComponentType<SwaggerUIProps>;
const passThroughRequestInterceptor: NonNullable<SwaggerUIProps['requestInterceptor']> = request => request;
const passThroughResponseInterceptor: NonNullable<SwaggerUIProps['responseInterceptor']> = response => response;

interface ApiDocsPageViewProps {
  availableTags: OpenApiTag[];
  error: string | null;
  filteredSpec: OpenApiSpec | undefined;
  isLoading: boolean;
  selectedTag: string;
  onSelectedTagChange: (tag: string) => void;
}

export function ApiDocsPageView({
  availableTags,
  error,
  filteredSpec,
  isLoading,
  selectedTag,
  onSelectedTagChange,
}: ApiDocsPageViewProps) {
  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>API Documentation Error</h2>
        <p>Failed to load API documentation: {error}</p>
        <p>Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Loading API Documentation...</h2>
        <p>Please wait while we load the API documentation.</p>
      </div>
    );
  }

  return (
    <>
      <ApiDocsSwaggerTheme />
      <div style={{ height: '100%', width: '100%', overflow: 'auto' }}>
        <ApiDocsHeader
          availableTags={availableTags}
          selectedTag={selectedTag}
          onSelectedTagChange={onSelectedTagChange}
        />
        <div style={{ height: 'calc(100vh - 120px)' }}>
          <SwaggerUI
            spec={filteredSpec}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            displayOperationId={false}
            displayRequestDuration={true}
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
            requestInterceptor={passThroughRequestInterceptor}
            responseInterceptor={passThroughResponseInterceptor}
          />
        </div>
      </div>
    </>
  );
}

function ApiDocsHeader({
  availableTags,
  selectedTag,
  onSelectedTagChange,
}: Pick<ApiDocsPageViewProps, 'availableTags' | 'selectedTag' | 'onSelectedTagChange'>) {
  return (
    <div style={{ padding: '20px', borderBottom: '1px solid hsl(var(--border))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', fontWeight: '600', color: 'hsl(var(--foreground))' }}>API Documentation</h1>
          <p style={{ margin: '0', color: 'hsl(var(--muted-foreground))' }}>
            Interactive API documentation for the Studio recruitment management system
          </p>
        </div>
        <ApiDocsTagFilter
          availableTags={availableTags}
          selectedTag={selectedTag}
          onSelectedTagChange={onSelectedTagChange}
        />
      </div>
    </div>
  );
}

function ApiDocsTagFilter({
  availableTags,
  selectedTag,
  onSelectedTagChange,
}: Pick<ApiDocsPageViewProps, 'availableTags' | 'selectedTag' | 'onSelectedTagChange'>) {
  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className="tag-filter-container" style={{ minWidth: '250px', marginLeft: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: 'hsl(var(--foreground))' }}>
        Filter by Tag
      </label>
      <Select value={selectedTag} onValueChange={onSelectedTagChange}>
        <SelectTrigger className="w-full select-trigger">
          <SelectValue placeholder="Select a tag to filter" />
        </SelectTrigger>
        <SelectContent className="select-content">
          <SelectItem value="all" className="select-item">All Endpoints</SelectItem>
          {availableTags.map((tag) => (
            <SelectItem key={tag.name} value={tag.name} className="select-item">
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
