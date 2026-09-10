import prisma from '@/lib/prisma';
import { getSystemSetting } from '@/lib/systemSettings';

export const SERVICE_DESK_EMBEDDING_DIMENSIONS = 384;
const MAX_CHUNK_CHARS = 1200;
const CHUNK_OVERLAP_CHARS = 180;
const QDRANT_COLLECTION = 'service_desk_knowledge_chunks';
const DEFAULT_QDRANT_REQUEST_TIMEOUT_MS = 10000;

type QdrantConfig = {
  baseUrl: string;
  apiKey: string | null;
  collectionName: string;
  requestTimeoutMs: number;
};

type QdrantSearchRequestPayload = {
  vector: number[];
  filter: {
    must: Array<{ key: string; match: { value: string } }>;
  };
  limit: number;
  with_payload: true;
  with_vector: false;
};

type QdrantSearchResultItem = {
  id: string | number;
  score: number | string;
  payload?: {
    documentId?: string;
    fileName?: string;
    content?: string;
    categoryId?: string;
    chunkIndex?: number;
  };
};

type QdrantUpsertPoint = {
  id: string;
  vector: number[];
  payload: {
    documentId: string;
    categoryId: string;
    chunkIndex: number;
    fileName: string;
    content: string;
  };
};

type QdrantResponse<T> = {
  result: T;
};

const qdrantCollectionPromises = new Map<string, Promise<void>>();

function parseTimeoutMs(rawValue: string | null | undefined, fallback: number) {
  const parsed = Number.parseInt(String(rawValue || '').trim(), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.max(1000, parsed);
}

async function getQdrantConfig(): Promise<QdrantConfig | null> {
  const [baseUrlSetting, apiKeySetting, collectionSetting, requestTimeoutSetting] = await Promise.all([
    getSystemSetting('serviceDeskKnowledgeBaseUrl'),
    getSystemSetting('serviceDeskKnowledgeBaseApiKey'),
    getSystemSetting('serviceDeskKnowledgeBaseCollectionName'),
    getSystemSetting('serviceDeskKnowledgeBaseRequestTimeoutMs'),
  ]);

  const baseUrl = (baseUrlSetting || process.env.QDRANT_URL || '').trim().replace(/\/+$/, '');
  if (!baseUrl) return null;

  return {
    baseUrl,
    apiKey: apiKeySetting?.trim() || process.env.QDRANT_API_KEY?.trim() || null,
    collectionName: collectionSetting?.trim() || process.env.QDRANT_COLLECTION_NAME?.trim() || QDRANT_COLLECTION,
    requestTimeoutMs: parseTimeoutMs(
      requestTimeoutSetting || process.env.QDRANT_REQUEST_TIMEOUT_MS,
      DEFAULT_QDRANT_REQUEST_TIMEOUT_MS,
    ),
  };
}

function buildQdrantHeaders(config: QdrantConfig): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(config.apiKey ? { 'api-key': config.apiKey } : {}),
  };
}

async function qdrantRequest<T>(config: QdrantConfig, path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, config.requestTimeoutMs);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      ...options,
      headers: {
        ...buildQdrantHeaders(config),
        ...options.headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Qdrant request failed (${response.status} ${response.statusText}): ${body}`);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function assertQdrantConfigured() {
  const config = await getQdrantConfig();
  if (!config) {
    throw new Error('Qdrant is not configured. Set QDRANT_URL in the environment to enable the knowledge base vector index.');
  }
  return config;
}

function getQdrantCollectionKey(config: QdrantConfig) {
  return `${config.baseUrl}|${config.collectionName}`;
}

async function ensureQdrantCollection(config: QdrantConfig) {
  const key = getQdrantCollectionKey(config);
  const existing = qdrantCollectionPromises.get(key);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    const encodedCollection = encodeURIComponent(config.collectionName);
    const exists = await qdrantRequest<QdrantResponse<{ status: string }>>(config, `/collections/${encodedCollection}`, {
      method: 'GET',
    }).then(() => true)
      .catch(error => {
        if (error instanceof Error && error.message.includes('404')) return false;
        throw error;
      });

    if (exists) return;

    await qdrantRequest<QdrantResponse<unknown>>(config, `/collections/${encodedCollection}`, {
      method: 'PUT',
      body: JSON.stringify({
        vectors: {
          size: SERVICE_DESK_EMBEDDING_DIMENSIONS,
          distance: 'Cosine',
        },
      }),
    });
  })();

  qdrantCollectionPromises.set(key, promise);

  try {
    await promise;
  } catch (error) {
    qdrantCollectionPromises.delete(key);
    throw error;
  }
}

function buildQdrantPointId(documentId: string, chunkIndex: number) {
  return `${documentId}:${chunkIndex}`;
}

function assertEmbedding(embedding: number[]) {
  if (embedding.length !== SERVICE_DESK_EMBEDDING_DIMENSIONS || embedding.some(value => !Number.isFinite(value))) {
    throw new Error('Invalid service desk embedding.');
  }
}

async function searchServiceDeskKnowledgeInQdrant(
  config: QdrantConfig,
  categoryId: string,
  queryEmbedding: number[],
  limit: number,
) {
  await ensureQdrantCollection(config);

  const path = `/collections/${encodeURIComponent(config.collectionName)}/points/search`;
  const payload: QdrantSearchRequestPayload = {
    vector: queryEmbedding,
    filter: {
      must: [{ key: 'categoryId', match: { value: categoryId } }],
    },
    limit,
    with_payload: true,
    with_vector: false,
  };

  const response = await qdrantRequest<{ result: QdrantSearchResultItem[] }>(config, path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.result
    .map(item => ({
      documentId: String(item.payload?.documentId || ''),
      fileName: String(item.payload?.fileName || ''),
      content: String(item.payload?.content || ''),
      score: Number(item.score),
    }))
    .filter(match => match.documentId && match.fileName && match.content)
    .slice(0, limit) satisfies ServiceDeskKnowledgeMatch[];
}

async function upsertServiceDeskKnowledgeChunksInQdrant(
  config: QdrantConfig,
  documentId: string,
  categoryId: string,
  fileName: string,
  chunks: string[],
  embeddings: number[][],
) {
  await ensureQdrantCollection(config);

  const points = chunks.map((content, index) => {
    const vector = embeddings[index];
    assertEmbedding(vector);
    return {
      id: buildQdrantPointId(documentId, index),
      vector,
      payload: {
        documentId,
        categoryId,
        chunkIndex: index,
        fileName,
        content,
      },
    } satisfies QdrantUpsertPoint;
  });

  if (!points.length) return;

  await qdrantRequest(config, `/collections/${encodeURIComponent(config.collectionName)}/points`, {
    method: 'PUT',
    body: JSON.stringify({
      points,
      wait: true,
    }),
  });
}

async function deleteServiceDeskKnowledgeEmbeddingsInQdrant(config: QdrantConfig, documentId: string) {
  await qdrantRequest(config, `/collections/${encodeURIComponent(config.collectionName)}/points/delete`, {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        must: [{ key: 'documentId', match: { value: documentId } }],
      },
      wait: true,
    }),
  });
}

export type ServiceDeskKnowledgeMatch = {
  documentId: string;
  fileName: string;
  content: string;
  score: number;
};

export function chunkKnowledgeText(text: string) {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n\s*\n/).map(value => value.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  function pushCurrent() {
    const value = current.trim();
    if (value) chunks.push(value);
    current = '';
  }

  for (const paragraph of paragraphs) {
    if (paragraph.length > MAX_CHUNK_CHARS) {
      pushCurrent();
      for (let start = 0; start < paragraph.length; start += MAX_CHUNK_CHARS - CHUNK_OVERLAP_CHARS) {
        chunks.push(paragraph.slice(start, start + MAX_CHUNK_CHARS).trim());
      }
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length <= MAX_CHUNK_CHARS) {
      current = candidate;
      continue;
    }

    pushCurrent();
    current = paragraph;
  }

  pushCurrent();
  return chunks.filter(Boolean);
}

export function createLocalKnowledgeEmbedding(text: string) {
  const vector = Array<number>(SERVICE_DESK_EMBEDDING_DIMENSIONS).fill(0);
  const tokens = text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const features = [...tokens, ...tokens.slice(0, -1).map((token, index) => `${token}_${tokens[index + 1]}`)];

  for (const feature of features) {
    let hash = 2166136261;
    for (let index = 0; index < feature.length; index += 1) {
      hash ^= feature.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    const bucket = (hash >>> 0) % SERVICE_DESK_EMBEDDING_DIMENSIONS;
    vector[bucket] += (hash & 1) === 0 ? 1 : -1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map(value => Number((value / magnitude).toFixed(8)));
}

export async function searchServiceDeskKnowledge(categoryId: string, query: string, limit = 5) {
  const config = await assertQdrantConfigured();
  const vector = createLocalKnowledgeEmbedding(query);
  const normalizedLimit = Math.max(1, Math.min(limit, 10));
  return searchServiceDeskKnowledgeInQdrant(config, categoryId, vector, normalizedLimit);
}

export async function upsertServiceDeskKnowledgeChunks(
  documentId: string,
  categoryId: string,
  fileName: string,
  chunks: string[],
) {
  const config = await assertQdrantConfigured();
  const embeddings = chunks.map(chunk => createLocalKnowledgeEmbedding(chunk));
  await upsertServiceDeskKnowledgeChunksInQdrant(config, documentId, categoryId, fileName, chunks, embeddings);
}

export async function deleteServiceDeskKnowledgeEmbeddings(documentId: string) {
  const config = await getQdrantConfig();
  if (config) {
    await deleteServiceDeskKnowledgeEmbeddingsInQdrant(config, documentId).catch(() => undefined);
  }

  await prisma.$executeRawUnsafe(`DELETE FROM service_desk_knowledge_chunks WHERE document_id = $1::uuid`, documentId);
}

export function buildServiceDeskKnowledgeContext(matches: ServiceDeskKnowledgeMatch[]) {
  return matches.map((match, index) => (
    `[Source ${index + 1}: ${match.fileName}]\n${match.content}`
  )).join('\n\n');
}
