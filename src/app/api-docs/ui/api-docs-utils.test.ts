import { describe, expect, it } from 'vitest';

import {
  getApiDocsEndpointKey,
  getApiDocsEndpointsByTag,
  getApiDocsMethodColor,
  getApiDocsResponseCodeClassName,
  getApiDocsTags,
} from './api-docs-utils';
import type { SwaggerSpec } from './api-docs-types';

const spec: SwaggerSpec = {
  openapi: '3.0.0',
  info: { title: 'API', version: '1', description: 'Docs' },
  servers: [],
  paths: {
    '/users': {
      get: { tags: ['Users'], summary: 'List users' },
      post: { tags: ['Users'], summary: 'Create user' },
    },
    '/health': {
      get: { tags: ['System'], summary: 'Health' },
    },
  },
};

describe('api docs utils', () => {
  it('derives tags and endpoints from an OpenAPI spec', () => {
    expect(getApiDocsTags(spec.paths)).toEqual(['System', 'Users']);
    expect(getApiDocsEndpointsByTag(spec, 'Users').map(endpoint => endpoint.summary)).toEqual([
      'List users',
      'Create user',
    ]);
    expect(getApiDocsEndpointsByTag(spec, 'all')).toHaveLength(3);
    expect(getApiDocsEndpointsByTag(null, 'all')).toEqual([]);
  });

  it('formats endpoint keys and status colors', () => {
    expect(getApiDocsEndpointKey('/users', 'get')).toBe('GET-/users');
    expect(getApiDocsMethodColor('POST')).toContain('bg-blue-100');
    expect(getApiDocsMethodColor('POST')).toContain('dark:bg-blue-950/60');
    expect(getApiDocsMethodColor('options')).toContain('bg-muted');
    expect(getApiDocsResponseCodeClassName('200')).toContain('bg-green-100');
    expect(getApiDocsResponseCodeClassName('404')).toContain('bg-red-100');
    expect(getApiDocsResponseCodeClassName('500')).toContain('bg-muted');
  });
});
