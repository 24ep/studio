import type {
  ApiEndpoint,
  OpenApiParameter,
  OpenApiResponses,
} from './api-docs-types';
import {
  getApiDocsEndpointKey,
  getApiDocsMethodColor,
  getApiDocsResponseCodeClassName,
} from './api-docs-utils';

interface ApiDocsEndpointListProps {
  endpoints: ApiEndpoint[];
  expandedEndpoints: Set<string>;
  selectedTag: string;
  onToggleEndpoint: (path: string, method: string) => void;
}

export function ApiDocsEndpointList({
  endpoints,
  expandedEndpoints,
  onToggleEndpoint,
  selectedTag,
}: ApiDocsEndpointListProps) {
  return (
    <div className="flex-1">
      <div className="rounded-lg border border-border bg-card shadow-sm dark:shadow-none">
        <div className="border-b border-border p-6">
          <h2 className="text-xl font-semibold text-card-foreground">
            {selectedTag === 'all' ? 'All Endpoints' : selectedTag}
          </h2>
          <p className="mt-1 text-muted-foreground">
            {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="divide-y divide-border">
          {endpoints.map((endpoint) => (
            <ApiDocsEndpointRow
              key={getApiDocsEndpointKey(endpoint.path, endpoint.method)}
              endpoint={endpoint}
              expanded={expandedEndpoints.has(getApiDocsEndpointKey(endpoint.path, endpoint.method))}
              onToggle={() => onToggleEndpoint(endpoint.path, endpoint.method)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ApiDocsEndpointRow({
  endpoint,
  expanded,
  onToggle,
}: {
  endpoint: ApiEndpoint;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="p-6">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-md p-2 text-left transition-colors hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 rounded text-xs font-medium border ${getApiDocsMethodColor(endpoint.method)}`}>
            {endpoint.method.toUpperCase()}
          </span>
          <span className="font-mono text-sm text-foreground">{endpoint.path}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{endpoint.summary}</span>
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && <ApiDocsEndpointDetails endpoint={endpoint} />}
    </div>
  );
}

function ApiDocsEndpointDetails({ endpoint }: { endpoint: ApiEndpoint }) {
  return (
    <div className="mt-4 border-l-2 border-border pl-4">
      {endpoint.description && (
        <p className="mb-4 text-sm text-muted-foreground">{endpoint.description}</p>
      )}

      {endpoint.parameters && <ApiDocsParameters parameters={endpoint.parameters} />}
      {endpoint.requestBody !== undefined && endpoint.requestBody !== null && (
        <div className="mt-4">
          <h4 className="mb-2 text-sm font-semibold text-foreground">Request Body:</h4>
          <div className="rounded bg-muted p-3">
            <pre className="overflow-x-auto text-xs text-foreground">
              {JSON.stringify(endpoint.requestBody, null, 2)}
            </pre>
          </div>
        </div>
      )}
      {endpoint.responses && <ApiDocsResponses responses={endpoint.responses} />}
    </div>
  );
}

function ApiDocsParameters({ parameters }: { parameters: OpenApiParameter[] }) {
  if (parameters.length === 0) return null;

  return (
    <div className="mt-4">
      <h4 className="mb-2 text-sm font-semibold text-foreground">Parameters:</h4>
      <div className="space-y-2">
        {parameters.map((param, index) => (
          <div key={index} className="rounded bg-muted p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{param.name}</span>
              <span className="text-xs text-muted-foreground">({param.in})</span>
              {param.required && (
                <span className="rounded bg-red-100 px-1 text-xs text-red-800 dark:bg-red-950/60 dark:text-red-300">Required</span>
              )}
            </div>
            {param.description && (
              <p className="mt-1 text-sm text-muted-foreground">{param.description}</p>
            )}
            {param.schema && (
              <p className="mt-1 text-xs text-muted-foreground">Type: {param.schema.type}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiDocsResponses({ responses }: { responses: OpenApiResponses }) {
  return (
    <div className="mt-4">
      <h4 className="mb-2 text-sm font-semibold text-foreground">Responses:</h4>
      <div className="space-y-2">
        {Object.entries(responses).map(([code, response]) => (
          <div key={code} className="rounded bg-muted p-3">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium px-2 py-1 rounded ${getApiDocsResponseCodeClassName(code)}`}>
                {code}
              </span>
              <span className="text-sm text-muted-foreground">{response.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
