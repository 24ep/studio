CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE service_desk_categories
  ADD COLUMN ai_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN system_prompt TEXT NOT NULL DEFAULT '';

CREATE TABLE service_desk_knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_desk_categories(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  storage_key TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  chunk_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT service_desk_knowledge_documents_category_file_key UNIQUE (category_id, file_name)
);

CREATE INDEX service_desk_knowledge_documents_category_status_idx
  ON service_desk_knowledge_documents(category_id, status);

CREATE TABLE service_desk_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES service_desk_knowledge_documents(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES service_desk_categories(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_estimate INTEGER NOT NULL,
  embedding vector(384) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT service_desk_knowledge_chunks_document_index_key UNIQUE (document_id, chunk_index)
);

CREATE INDEX service_desk_knowledge_chunks_category_idx
  ON service_desk_knowledge_chunks(category_id);

CREATE INDEX service_desk_knowledge_chunks_embedding_hnsw_idx
  ON service_desk_knowledge_chunks USING hnsw (embedding vector_cosine_ops);
