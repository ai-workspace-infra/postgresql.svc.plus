-- schema.sql
-- Base business schema for the account service.
-- Works with both one-way async sync (pgsync) and pglogical multi-master.
-- PostgreSQL 16 + gen_random_uuid()
-- =========================================

-- Ensure the public schema exists without dropping other extensions.
CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION CURRENT_USER;

-- Clean up existing tables so the script is idempotent without requiring
-- superuser privileges that would be needed to drop the entire schema.
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.identities CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.admin_settings CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- =========================================
-- Extensions
-- =========================================
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- pglogical specific defaults are now applied by schema_pglogical_patch.sql.

-- =========================================
-- Functions
-- =========================================

-- 更新时间戳
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 邮箱验证标志维护
CREATE OR REPLACE FUNCTION public.maintain_email_verified() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.email_verified := (NEW.email_verified_at IS NOT NULL);
  RETURN NEW;
END;
$$;

-- 双向复制版本号自增触发器
CREATE OR REPLACE FUNCTION public.bump_version() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.version := COALESCE(OLD.version, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$;

-- Tables
-- =========================================

CREATE TABLE public.users (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  level INTEGER NOT NULL DEFAULT 20,
  groups JSONB NOT NULL DEFAULT '[]'::jsonb,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0, -- 🔢 行版本号
  origin_node TEXT NOT NULL DEFAULT 'local', -- 🌍 来源节点，可在不同区域通过 ALTER TABLE 或 pglogical patch 覆盖
  mfa_totp_secret TEXT,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret_issued_at TIMESTAMPTZ,
  mfa_confirmed_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  email_verified BOOLEAN GENERATED ALWAYS AS ((email_verified_at IS NOT NULL)) STORED
);

CREATE TABLE public.identities (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  user_uuid UUID NOT NULL REFERENCES public.users(uuid) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0,
  origin_node TEXT NOT NULL DEFAULT 'local',
  CONSTRAINT identities_provider_external_id_uk UNIQUE (provider, external_id)
);

CREATE TABLE public.sessions (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  user_uuid UUID NOT NULL REFERENCES public.users(uuid) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  version BIGINT NOT NULL DEFAULT 0,
  origin_node TEXT NOT NULL DEFAULT 'local'
);

CREATE TABLE public.admin_settings (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT NOT NULL,
  role TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  version BIGINT NOT NULL DEFAULT 1,
  origin_node TEXT NOT NULL DEFAULT 'local',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_settings_module_role_uk UNIQUE (module_key, role)
);

CREATE TABLE public.subscriptions (
  uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_uuid UUID NOT NULL REFERENCES public.users(uuid) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'subscription',
  plan_id TEXT,
  external_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  CONSTRAINT subscriptions_user_external_uk UNIQUE (user_uuid, external_id)
);

-- =========================================
-- Indexes
-- =========================================
CREATE UNIQUE INDEX users_username_lower_uk ON public.users (lower(username));
CREATE UNIQUE INDEX users_email_lower_uk ON public.users (lower(email)) WHERE email IS NOT NULL;
CREATE INDEX idx_identities_user_uuid ON public.identities (user_uuid);
CREATE INDEX idx_sessions_user_uuid ON public.sessions (user_uuid);
CREATE INDEX idx_admin_settings_version ON public.admin_settings (version);
CREATE INDEX idx_subscriptions_user_uuid ON public.subscriptions (user_uuid);
CREATE INDEX idx_subscriptions_status ON public.subscriptions (status);

-- =========================================
-- Triggers
-- =========================================

-- users
CREATE TRIGGER trg_users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_users_maintain_email_verified
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.maintain_email_verified();

CREATE TRIGGER trg_users_bump_version
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.bump_version();

-- identities
CREATE TRIGGER trg_identities_set_updated_at
  BEFORE UPDATE ON public.identities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_identities_bump_version
  BEFORE UPDATE ON public.identities
  FOR EACH ROW EXECUTE FUNCTION public.bump_version();

-- sessions
CREATE TRIGGER trg_sessions_set_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_sessions_bump_version
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.bump_version();

-- admin_settings
CREATE TRIGGER trg_admin_settings_set_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_admin_settings_bump_version
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.bump_version();

-- subscriptions
CREATE TRIGGER trg_subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
