import { describe, expect, it } from 'vitest';

import {
  chunkKnowledgeText,
  createLocalKnowledgeEmbedding,
  SERVICE_DESK_EMBEDDING_DIMENSIONS,
} from './service-desk-knowledge';

describe('service desk knowledge helpers', () => {
  it('chunks long text into overlapping bounded sections', () => {
    const chunks = chunkKnowledgeText(`${'Policy sentence. '.repeat(90)}\n\n${'Second section. '.repeat(60)}`);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every(chunk => chunk.length <= 1200)).toBe(true);
  });

  it('creates stable normalized embeddings', () => {
    const first = createLocalKnowledgeEmbedding('Reset my account password');
    const second = createLocalKnowledgeEmbedding('Reset my account password');
    expect(first).toEqual(second);
    expect(first).toHaveLength(SERVICE_DESK_EMBEDDING_DIMENSIONS);
    expect(Math.sqrt(first.reduce((sum, value) => sum + value * value, 0))).toBeCloseTo(1, 5);
  });

});
