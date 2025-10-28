# Tests de Diagnóstico - Recetas API

Esta carpeta contiene scripts de diagnóstico para verificar cada componente del sistema de persistencia.

## Ejecución de Tests

Ejecuta los tests en orden para diagnosticar problemas:

```bash
# Test 1: Verificar conexión a base de datos
node tests/1-test-db-connection.js

# Test 2: Verificar que las migraciones se aplicaron
node tests/2-test-migrations.js

# Test 3: Verificar configuración de Supabase
node tests/3-test-supabase-config.js

# Test 4: Probar inserción directa en BD
node tests/4-test-direct-insert.js

# Test 5: Probar endpoints API (requiere servidor corriendo)
node src/app.js &  # En una terminal separada
node tests/5-test-api-endpoints.js
```

## Ejecutar todos los tests

```bash
# PowerShell
node tests/1-test-db-connection.js; node tests/2-test-migrations.js; node tests/3-test-supabase-config.js; node tests/4-test-direct-insert.js

# Para el test 5, arranca el servidor primero:
node src/app.js
# En otra terminal:
node tests/5-test-api-endpoints.js
```

## Interpretación de Resultados

### ✅ Test 1 - Conexión BD

- **PASA**: DATABASE_URL correcta, BD accesible
- **FALLA**: Revisa DATABASE_URL en `src/.env`

### ✅ Test 2 - Migraciones

- **PASA**: Tablas `recipes` y `users` existen con columnas correctas
- **FALLA**: Ejecuta `npm run migrate`

### ✅ Test 3 - Config Supabase

- **PASA**: Variables SUPABASE\_\* configuradas, usará SupabaseRecetaRepository
- **FALLA**: Usará MemoryRepository (no persiste), configura variables en `src/.env`

### ✅ Test 4 - Inserción Directa

- **PASA**: BD acepta inserts cuando se bypasa RLS
- **FALLA**: Problema con estructura BD o constraints

### ✅ Test 5 - Endpoints API

- **PASA**: API funciona y persiste en Supabase
- **FALLA**: Problema con repositorio, RLS, o configuración Supabase

## Soluciones Comunes

1. **Test 1 falla**: Verifica `DATABASE_URL` en `src/.env`
2. **Test 3 muestra MemoryRepository**: Añade `SUPABASE_URL` y `SUPABASE_ANON_KEY`
3. **Test 4 pasa pero Test 5 falla**: Problema con RLS, añade `SUPABASE_SERVICE_ROLE_KEY`
4. **Test 5 recetas no persisten**: La app usa MemoryRepository, revisa configuración
