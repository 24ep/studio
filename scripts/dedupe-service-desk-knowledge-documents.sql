DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT to_regclass('public.service_desk_knowledge_documents') IS NOT NULL INTO table_exists;

  IF NOT table_exists THEN
    RAISE NOTICE 'service_desk_knowledge_documents table not found; skipping dedupe';
    RETURN;
  END IF;

  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY category_id, file_name
        ORDER BY COALESCE(updated_at, created_at) DESC, id DESC
      ) AS rn
    FROM service_desk_knowledge_documents
  ),
  duplicate_ids AS (
    SELECT id
    FROM ranked
    WHERE rn > 1
  )
  DELETE FROM service_desk_knowledge_documents
  WHERE id IN (SELECT id FROM duplicate_ids);

  RAISE NOTICE 'service_desk_knowledge_documents duplicate cleanup completed';
END $$;
