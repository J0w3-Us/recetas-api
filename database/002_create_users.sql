-- Migration: 0002_create_users.sql
-- Fecha: 2025-10-28
-- Crea la tabla public.users (idempotente)

-- Usamos gen_random_uuid() si está disponible (pgcrypto extension) o uuid_generate_v4()
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    -- try to create extension, ignore errors if not allowed
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
    EXCEPTION WHEN others THEN
      -- ignore
    END;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text,
  name text,
  avatar_url text,
  role text DEFAULT 'user',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Nota: si estás usando Supabase Auth puedes mapear usuarios a auth.users (uid) en lugar de crear duplicados.
