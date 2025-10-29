-- Migration: 0001_create_recipes_with_recommendations.sql
-- Fecha: 2025-10-28
-- Versión mejorada del script con recomendaciones de seguridad y rendimiento:
-- - Campo `is_public` para controlar visibilidad pública/privada
-- - Índice en `user_id` para consultas por autor
-- - Política SELECT que permite leer recetas públicas o propias

-- ========= PARTE 1: CREACIÓN DE LA TABLA 'recipes' (MEJORADA) =========
CREATE TABLE public.recipes (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at timestamptz DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text,
    steps jsonb,
    ingredients jsonb,
    user_id uuid NOT NULL,
    is_public boolean DEFAULT true NOT NULL
);

-- Índice para mejorar búsquedas por autor
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes (user_id);

-- ========= PARTE 2: DEFINICIÓN DE LA LLAVE FORÁNEA =========
ALTER TABLE public.recipes
ADD CONSTRAINT fk_user
FOREIGN KEY (user_id)
REFERENCES auth.users (id)
ON DELETE CASCADE;

-- ========= PARTE 3: ACTIVACIÓN DE LA SEGURIDAD A NIVEL DE FILA (RLS) =========
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- ========= PARTE 4: POLÍTICAS RLS RECOMENDADAS =========

-- 1) SELECT: permitir leer recetas públicas o las propias del usuario autenticado
CREATE POLICY "Select public or own recipes"
ON public.recipes
FOR SELECT
TO authenticated
USING (is_public = true OR auth.uid() = user_id);

-- 2) INSERT: crear sólo recetas donde el user_id coincida con auth.uid()
CREATE POLICY "Insert own recipes only"
ON public.recipes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3) UPDATE: sólo actualizar si es el creador (y opcionalmente que no cambie user_id)
CREATE POLICY "Update own recipes only"
ON public.recipes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4) DELETE: sólo el propio usuario puede eliminar
CREATE POLICY "Delete own recipes only"
ON public.recipes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Comentario final
COMMENT ON TABLE public.recipes IS 'Tabla para almacenar las recetas de los usuarios. is_public controla visibilidad.';

-- NOTAS:
-- - Si quieres que las recetas sean totalmente públicas (incluso para usuarios no autenticados), añade una política FOR SELECT TO public USING (is_public = true);
-- - La referencia a auth.users funciona en Supabase, pero en algunos setups puede requerir privilegios concretos.
