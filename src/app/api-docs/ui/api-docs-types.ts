export interface OpenApiSchema {
  type?: string;
  [key: string]: unknown;
}

export interface OpenApiParameter {
  name?: string;
  in?: string;
  required?: boolean;
  description?: string;
  schema?: OpenApiSchema;
}

export interface OpenApiResponse {
  description?: string;
  [key: string]: unknown;
}

export type OpenApiResponses = Record<string, OpenApiResponse>;

export interface OpenApiOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: unknown;
  responses?: OpenApiResponses;
  [key: string]: unknown;
}

export type OpenApiPathItem = Record<string, OpenApiOperation>;
export type OpenApiPaths = Record<string, OpenApiPathItem>;

export interface ApiEndpoint {
  path: string;
  method: string;
  summary: string;
  description?: string;
  tags: string[];
  parameters?: OpenApiParameter[];
  requestBody?: unknown;
  responses?: OpenApiResponses;
}

export interface SwaggerSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: OpenApiPaths;
  components?: Record<string, unknown>;
}
