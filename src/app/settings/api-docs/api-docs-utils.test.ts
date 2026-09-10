import { describe, expect, it } from 'vitest';

import {
  filterOpenApiSpecByTag,
  getAvailableOpenApiTags,
  type SwaggerSpecState,
} from './api-docs-utils';

const swaggerSpec: SwaggerSpecState = {
  servers: [],
  spec: {
    openapi: '3.0.0',
    tags: [
      { name: 'Applicants', description: 'Applicant endpoints' },
      { name: 'Settings' },
      { name: '' },
    ],
    paths: {
      '/applicants': {
        get: { tags: ['Applicants'], summary: 'List applicants' },
        post: { tags: ['Applicants'], summary: 'Create applicant' },
      },
      '/settings': {
        get: { tags: ['Settings'], summary: 'List settings' },
      },
      '/health': {
        get: { summary: 'Health check' },
      },
    },
  },
};

describe('api-docs-utils', () => {
  it('returns available OpenAPI tags with string names', () => {
    expect(getAvailableOpenApiTags(swaggerSpec.spec)).toEqual([
      { name: 'Applicants', description: 'Applicant endpoints' },
      { name: 'Settings' },
      { name: '' },
    ]);
  });

  it('returns the full spec when all tags are selected', () => {
    expect(filterOpenApiSpecByTag(swaggerSpec, 'all')).toBe(swaggerSpec.spec);
  });

  it('filters paths to operations matching the selected tag', () => {
    expect(filterOpenApiSpecByTag(swaggerSpec, 'Applicants')?.paths).toEqual({
      '/applicants': {
        get: { tags: ['Applicants'], summary: 'List applicants' },
        post: { tags: ['Applicants'], summary: 'Create applicant' },
      },
    });
  });
});
