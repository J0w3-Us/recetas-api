-- Migración para añadir soporte de imágenes a las recetas
-- Fecha: 2025-10-29
-- Descripción: Añade campo image_url a la tabla recipes

-- Añadir columna image_url a la tabla recipes
ALTER TABLE recipes 
ADD COLUMN image_url TEXT;

-- Añadir comentario para documentar el campo
COMMENT ON COLUMN recipes.image_url IS 'URL de la imagen de la receta (opcional). Puede ser una URL absoluta o relativa.';

-- Opcional: Crear índice para consultas por imagen
CREATE INDEX IF NOT EXISTS idx_recipes_image_url ON recipes(image_url) WHERE image_url IS NOT NULL;

-- Verificar que la migración se aplicó correctamente
-- Esta consulta debería mostrar la nueva columna
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'recipes' AND table_schema = 'public'
ORDER BY ordinal_position;