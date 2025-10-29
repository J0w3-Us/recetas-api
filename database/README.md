# 🗄️ Migraciones de Base de Datos

Este directorio contiene las migraciones SQL para la base de datos de recetas en Supabase.

## 📋 Migraciones Disponibles

### 001_add_image_url_to_recipes.sql

**Fecha:** 2025-10-29  
**Propósito:** Añadir soporte para imágenes en las recetas

**Cambios:**

- ✅ Añade columna `image_url` (TEXT, opcional) a la tabla `recipes`
- ✅ Añade comentario descriptivo
- ✅ Crea índice para optimizar consultas por imagen
- ✅ Incluye query de verificación

## 🚀 Cómo aplicar las migraciones

### Opción 1: Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Database** → **SQL Editor**
3. Copia y pega el contenido de la migración
4. Ejecuta el script

### Opción 2: CLI de Supabase

```bash
# Si tienes Supabase CLI instalado
supabase db reset --linked
# o aplicar migración específica
```

### Opción 3: Cliente programático

```javascript
// Usando el cliente de Supabase desde Node.js
const { supabaseAdmin } = require("../src/core/db/supabase");

async function applyMigration() {
  const sql = `
        ALTER TABLE recipes 
        ADD COLUMN image_url TEXT;
        
        COMMENT ON COLUMN recipes.image_url IS 'URL de la imagen de la receta (opcional)';
    `;

  const { error } = await supabaseAdmin.rpc("exec_sql", { sql });
  if (error) console.error("Migration failed:", error);
  else console.log("✅ Migration applied successfully");
}
```

## ✅ Verificación de Migraciones

Después de aplicar una migración, verifica que se aplicó correctamente:

```sql
-- Verificar estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'recipes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar que el campo image_url existe
SELECT COUNT(*) as has_image_url_column
FROM information_schema.columns
WHERE table_name = 'recipes'
  AND column_name = 'image_url'
  AND table_schema = 'public';
```

## 📊 Estructura de la tabla recipes (después de migración)

```sql
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    steps JSONB DEFAULT '[]',
    ingredients JSONB DEFAULT '[]',
    user_id UUID REFERENCES auth.users(id),
    is_public BOOLEAN DEFAULT true,
    image_url TEXT  -- ✨ NUEVO CAMPO
);
```

## 🔄 Rollback (Deshacer migraciones)

Si necesitas deshacer la migración:

```sql
-- Rollback para 001_add_image_url_to_recipes.sql
ALTER TABLE recipes DROP COLUMN IF EXISTS image_url;
DROP INDEX IF EXISTS idx_recipes_image_url;
```

## 📝 Notas Importantes

- ✅ El campo `image_url` es **opcional** (puede ser NULL)
- ✅ Acepta URLs absolutas (`https://...`) o relativas (`/images/...`)
- ✅ No hay validación de formato en DB (se hace en aplicación)
- ✅ Compatible con recetas existentes (no afecta datos actuales)
- ✅ Optimizado con índice para consultas por imagen
