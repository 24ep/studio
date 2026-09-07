-- Extensions required by Studio's raw SQL features and migrations.
-- Keep this idempotent so startup and CI can run it before migrate deploy.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
