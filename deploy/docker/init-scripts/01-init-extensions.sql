-- PostgreSQL initialization script
-- This script runs automatically on first container startup

-- Core extensions shared by all supported deployment modes.
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional extensions are deliberately best-effort.  Supabase Cloud may not
-- expose the same extension catalog as the self-hosted image.  Any objects
-- that depend on an optional extension are created conditionally below.
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_jieba;
    RAISE NOTICE 'pg_jieba is available';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_jieba is unavailable; skipping optional tokenizer objects';
END $$;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pgmq;
    RAISE NOTICE 'pgmq is available';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgmq is unavailable; skipping optional queue objects';
END $$;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
    RAISE NOTICE 'pg_stat_statements is available';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_stat_statements is unavailable; continuing without it';
END $$;

-- Create a sample database for testing
CREATE DATABASE appdb;

-- Connect to the new database
\c appdb

-- Recreate extensions in the new database
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_jieba;
    RAISE NOTICE 'pg_jieba is available in appdb';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_jieba is unavailable in appdb; skipping optional tokenizer objects';
END $$;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pgmq;
    RAISE NOTICE 'pgmq is available in appdb';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgmq is unavailable in appdb; skipping optional queue objects';
END $$;

-- Create a sample schema
CREATE SCHEMA IF NOT EXISTS app;

-- Sample table with vector embeddings
CREATE TABLE IF NOT EXISTS app.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),  -- OpenAI ada-002 dimension
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON app.documents
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_documents_metadata ON app.documents
    USING gin (metadata);

CREATE INDEX IF NOT EXISTS idx_documents_content ON app.documents
    USING gin (to_tsvector('english', content));

-- Sample table for node management
CREATE TABLE IF NOT EXISTS app.nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    address TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 443,
    server_name TEXT,
    protocols JSONB NOT NULL DEFAULT '[]'::jsonb,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for available nodes
CREATE INDEX IF NOT EXISTS idx_nodes_available ON app.nodes (available);

-- Sample table with Chinese full-text search
CREATE TABLE IF NOT EXISTS app.articles_zh (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Keep the sample schema usable when pg_jieba is unavailable.  Production
-- migrations should expose this as a capability flag and choose their own
-- application-side fallback rather than relying on this demo index.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_jieba') THEN
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_articles_zh_content ON app.articles_zh USING gin (to_tsvector(''jiebacfg'', content))';
    ELSE
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_articles_zh_content ON app.articles_zh USING gin (to_tsvector(''simple'', content))';
    END IF;
END $$;

-- Sample key-value store using hstore
CREATE TABLE IF NOT EXISTS app.sessions (
    session_id TEXT PRIMARY KEY,
    data hstore NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON app.sessions (expires_at);

-- Create sample queues only when pgmq is installed.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgmq') THEN
        EXECUTE $q$SELECT pgmq.create('task_queue')$q$;
        EXECUTE $q$SELECT pgmq.create('notification_queue')$q$;
    ELSE
        RAISE NOTICE 'pgmq unavailable; skipping sample queues';
    END IF;
END $$;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON SCHEMA app TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app TO your_app_user;

COMMENT ON DATABASE appdb IS 'Application database with vector search, full-text search, and message queue capabilities';
COMMENT ON SCHEMA app IS 'Main application schema';
COMMENT ON TABLE app.documents IS 'Documents with vector embeddings for semantic search';
COMMENT ON TABLE app.articles_zh IS 'Chinese articles with jieba tokenization';
COMMENT ON TABLE app.sessions IS 'Session storage using hstore';
