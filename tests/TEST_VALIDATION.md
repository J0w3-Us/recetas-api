# 🧪 Tests de Validación - Recetas API

Este directorio contiene tests automáticos para verificar que la validación con `express-validator` funciona correctamente y es compatible con las llamadas del frontend Flutter.

## 📁 Archivos de Test

### `test-frontend-validation.js`

**Propósito:** Verifica que la validación funciona con payloads exactos del frontend.

- ✅ **Test payloads válidos** (formato Flutter)
- ❌ **Test payloads inválidos** (campos faltantes, muy cortos, etc.)
- ⚠️ **Test compatibilidad** campos español/inglés

**Ejecutar:**

```bash
npm run test:validation
# o directamente:
node tests/test-frontend-validation.js
```

### `test-field-compatibility.js`

**Propósito:** Demuestra cómo implementar validación flexible que acepta tanto campos en español (`titulo`, `descripcion`) como en inglés (`name`, `description`).

**Ejecutar:**

```bash
node tests/test-field-compatibility.js
```

### `test-update-delete-validation.js`

**Propósito:** Verifica que las validaciones para PUT y DELETE funcionan correctamente.

- ✅ **PUT válidos** (actualización completa y parcial)
- ❌ **PUT inválidos** (IDs incorrectos, datos mal formateados)
- 🚫 **Control de permisos** (solo propietarios pueden editar/eliminar)
- 🗑️ **DELETE con validación** de IDs y permisos
- 🔍 **Recursos no encontrados** (404)

**Ejecutar:**

```bash
npm run test:update-delete
```

### `test-real-api-calls.js`

**Propósito:** Hace llamadas HTTP reales al servidor para verificar validación end-to-end.

- 🔐 Login real o de prueba
- ✅ POST /api/recetas con datos válidos
- ❌ POST /api/recetas con datos inválidos
- 📖 GET /api/recetas para verificar que funcionan

**Ejecutar:**

```bash
# Asegúrate de que el servidor esté corriendo en puerto 3000 primero:
node src/app.js

# En otra terminal:
npm run test:real-api
```

## 🚀 Scripts NPM Disponibles

```bash
# Test básico de validación (sin servidor)
npm run test:validation

# Test de actualización y eliminación (sin servidor)
npm run test:update-delete

# Test contra API real (requiere servidor corriendo)
npm run test:real-api

# Test de integración completo (arranca/para servidor automáticamente)
npm run test:integration
```

## 📊 Resultados de Tests

### ✅ Tests que PASAN

- Validación con payloads válidos del frontend
- Detección correcta de errores en payloads inválidos
- Mensajes de error descriptivos en español
- Compatibilidad con formato mixto español/inglés (usando validación flexible)

### ⚠️ Incompatibilidades Detectadas

- El backend actual espera `name` pero el frontend podría enviar `titulo`
- Similar con `description` vs `descripcion`, `steps` vs `pasos`, etc.

### 💡 Solución Recomendada

Implementar validación flexible en `src/api/routes/receta.routes.js`:

```javascript
const flexibleValidation = [
  body(["name", "titulo"]).custom((value, { req }) => {
    const name = req.body.name || req.body.titulo;
    if (!name || name.trim() === "") {
      throw new Error("El título es obligatorio");
    }
    if (name.trim().length < 3) {
      throw new Error("El título debe tener al menos 3 caracteres");
    }
    return true;
  }),
  // Similar para description/descripcion, steps/pasos, ingredients/ingredientes
];
```

## 🔧 Dependencias de Test

- `express-validator` - Validación de datos
- `supertest` - Testing de APIs HTTP
- `node-fetch` - Cliente HTTP para Node.js (solo para tests reales)

## 📝 Formato de Datos del Frontend

Basado en la documentación del frontend Flutter, estos son los formatos esperados:

**Crear receta (formato inglés):**

```json
{
  "name": "string",
  "description": "string",
  "ingredients": ["string"],
  "steps": ["string"]
}
```

**Crear receta (formato español posible):**

```json
{
  "titulo": "string",
  "descripcion": "string",
  "ingredientes": ["string"],
  "pasos": ["string"]
}
```

## 🎯 Estado Actual de Validación

✅ **Implementado:**

- Validación de campos obligatorios (POST)
- Validación de campos opcionales (PUT - actualización parcial)
- Longitud mínima para `name` (3 caracteres)
- Arrays no vacíos para `steps` e `ingredients`
- Validación de IDs numéricos para PUT y DELETE
- Control de permisos (solo propietarios pueden editar/eliminar)
- Respuestas de error estructuradas con `express-validator`
- Manejo correcto de recursos no encontrados (404)
- Respuestas HTTP apropiadas (200, 204, 400, 403, 404)

⏳ **Pendiente de decidir:**

- Soporte para campos en español (`titulo`, `descripcion`, etc.)
- Validación del contenido de arrays (que cada step/ingredient sea string no vacío)
- Límites máximos de longitud
- Sanitización de HTML/caracteres especiales

## 🏃‍♂️ Ejecutar Todos los Tests

```bash
# Test rápido (solo validación, sin servidor)
npm run test:validation

# Si tienes el servidor corriendo en otra terminal:
npm run test:real-api

# Test de compatibilidad de campos:
node tests/test-field-compatibility.js
```

---

💡 **Tip:** Los tests están diseñados para ser ejecutados independientemente o como parte de CI/CD. Todos incluyen mensajes descriptivos y colores para facilitar la lectura de resultados.
