-- Migración para eliminar soporte de imágenes de las recetas
-- Fecha: 2025-10-29
-- Descripción: Elimina la columna image_url e índice asociado de la tabla recipes si existen

-- Eliminar índice asociado (si existe)
DROP INDEX IF EXISTS idx_recipes_image_url;

-- Eliminar columna image_url (si existe)
ALTER TABLE IF EXISTS recipes DROP COLUMN IF EXISTS image_url;

-- Verificación simple (opcional): comprobar esquema
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'image_url';
