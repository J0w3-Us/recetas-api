Recetas API - Endpoints

Base URL (dev): http://localhost:3000

Resumen rápido

- Auth endpoints: /api/auth/\* (register + login, plus test endpoints when app has Supabase configured)
- Recetas endpoints (protected): /api/recetas
- Debug endpoint (dev only, uses DATABASE_URL): /api/debug/recetas
- Info: /api/config and root /

---

1. GET /

- Método: GET
- Path: /
- Auth: no
- Descripción: Ruta raíz, devuelve un texto indicando que la API funciona
- Respuesta: text/plain "API del Recetario funcionando!"

2. GET /api/config

- Método: GET
- Path: /api/config
- Auth: no
- Descripción: Devuelve información pública sobre la configuración detectada (baseUrl, supabaseUrl). No expone keys.
- Respuesta (JSON): { "baseUrl": "http://localhost:3000", "supabaseUrl": "https://..." }

---

3. Autenticación (Supabase)

3.1 POST /api/auth/register

- Método: POST
- Path: /api/auth/register
- Auth: no
- Cuerpo (JSON):
  ```json
  {
    "name": "Ana García",
    "email": "ana@example.com",
    "password": "Secret123!"
  }
  ```
- Campos:
  - `name` (opcional): Nombre completo del usuario. Se guarda en `user_metadata` de auth.users y en `public.users`
  - `email` (requerido): Email del usuario
  - `password` (requerido): Contraseña (mínimo según configuración de Supabase)
- Descripción: Registra un usuario usando Supabase Auth (supabase.auth.signUp). El campo `name` se guarda tanto en `user_metadata` como en la tabla `public.users`. Dependiendo de la configuración de Supabase, puede requerir confirmación por email.
- Respuestas:

  - 201 Created: `{ user: { id, email, user_metadata: { name }, ... } }`
  - 400 Bad Request: `{ message: "..." }` (por ejemplo `user_already_exists` o `email_provider_disabled`)
  - 500 Internal Server Error: si hay error en el servidor

    3.2 POST /api/auth/login

- Método: POST
- Path: /api/auth/login
- Auth: no
- Cuerpo (JSON): { "email": "user@example.com", "password": "Secret123!" }
- Descripción: Hace signInWithPassword con Supabase y devuelve la sesión (access_token, refresh_token) si es correcto.
- Respuestas:

  - 200 OK: { session: { access_token, refresh_token, user, expires_in } }
  - 400 Bad Request: { message: "..." }

    3.3 (Modo test) POST /api/auth/register-test

- Método: POST
- Path: /api/auth/register-test
- Auth: no
- Nota: Montado cuando la app detecta credenciales Supabase; simula registro sin llamar a Supabase. Útil para desarrollo si Auth está complicado.
- Cuerpo: igual que /register
- Respuesta: 201 con objeto `user` simulado

  3.4 (Modo test) POST /api/auth/login-test

- Método: POST
- Path: /api/auth/login-test
- Auth: no
- Nota: Simula login y devuelve un `session` falso para pruebas.

---

4. Recetas (protected - requieren Authorization header)

Notas sobre autenticación:

- Todos los endpoints de recetas usan `authMiddleware` que espera el header `Authorization: Bearer <token>`.
- El token debe ser un access_token válido de Supabase (obtenido en /api/auth/login).

  4.1 POST /api/recetas

- Método: POST
- Path: /api/recetas
- Auth: Sí (Authorization: Bearer <token>)
- Cuerpo (JSON) ejemplo:
  {
  "name": "Tarta de manzana",
  "description": "Rica receta",
  "steps": ["Pelar", "Mezclar", "Hornear"],
  "ingredients": ["manzana", "harina", "azúcar"],
  "imageUrl": "https://ejemplo.com/tarta-manzana.jpg",
  "is_public": true
  }
- Campos:
  - `name` (requerido): título de la receta (mínimo 3 caracteres)
  - `description` (requerido): descripción de la receta
  - `steps` (requerido): array de pasos (mínimo 1 elemento)
  - `ingredients` (requerido): array de ingredientes (mínimo 1 elemento)
  - `imageUrl` (opcional): URL de la imagen de la receta (debe ser http/https, máximo 2000 caracteres)
  - `is_public` (opcional): visibilidad de la receta (default: true)
- Descripción: Crea una receta. El `userId` se toma del token (middleware). Devuelve la receta creada.
- Respuestas:
  - 201 Created: receta creada (objeto JSON)
  - 400 Bad Request: si falta `name` u otros errores de validación
  - 401 Unauthorized: si no se proporciona token o es inválido
- Nota sobre persistencia y RLS: Si tu app utiliza la ANON key y RLS está activo, los writes pueden fallar; la implementación del repositorio intenta usar `supabaseAdmin` (service role) cuando está disponible para bypass de RLS.

  4.2 GET /api/recetas

- Método: GET
- Path: /api/recetas
- Auth: Sí
- Query params: la implementación del repo soporta filtros internos (userId, is_public) pero la ruta pública devuelve todas las recetas desde el caso de uso. En la versión actual el handler llama a `obtenerTodasRecetasUseCase.execute()` sin filtros.
- Respuesta:

  - 200 OK: [ ...array de recetas... ]

    4.3 GET /api/recetas/mis-recetas

- Método: GET
- Path: /api/recetas/mis-recetas
- Auth: Sí (Authorization: Bearer <token>)
- Descripción: Obtiene solo las recetas creadas por el usuario autenticado. Ideal para la pantalla de perfil (pantalla 3.0). El userId se toma automáticamente del token.
- Ejemplo de llamada:
  ```bash
  # Pedimos solo las recetas del usuario logueado
  curl -X GET http://localhost:3000/api/recetas/mis-recetas \
  -H "Authorization: Bearer <tu_access_token>"
  ```
- Respuestas:

  - 200 OK: array de recetas del usuario
    ```json
    [
      {
        "id": 1,
        "name": "Mi primera receta",
        "description": "...",
        "steps": [...],
        "ingredients": [...],
        "imageUrl": "https://ejemplo.com/mi-primera-receta.jpg",
        "userId": "uuid-del-usuario-logueado",
        "is_public": true,
        "created_at": "2025-10-29T..."
      },
      {
        "id": 2,
        "name": "Mi segunda receta",
        ...
      }
    ]
    ```
  - 401 Unauthorized: si no se proporciona token o es inválido
  - 500 Internal Server Error: si hay error en el servidor

    4.4 GET /api/recetas/:id

- Método: GET
- Path: /api/recetas/:id
- Auth: Sí (Authorization: Bearer <token>)
- Descripción: Obtiene los detalles completos de una sola receta por su ID. Ideal para la pantalla de visualización de detalles (pantalla 2.1).
- Ejemplo de llamada:
  ```bash
  # Pedimos la receta con id '123'
  curl -X GET http://localhost:3000/api/recetas/123 \
  -H "Authorization: Bearer <tu_access_token>"
  ```
- Respuestas:

  - 200 OK: objeto JSON con toda la información de la receta
    ```json
    {
      "id": 123,
      "name": "Tarta de manzana",
      "description": "Rica receta",
      "steps": ["Pelar", "Mezclar", "Hornear"],
      "ingredients": ["manzana", "harina", "azúcar"],
      "imageUrl": "https://ejemplo.com/tarta-manzana.jpg",
      "userId": "uuid-del-usuario",
      "is_public": true,
      "created_at": "2025-10-29T..."
    }
    ```
  - 404 Not Found: `{ "message": "Receta no encontrada" }`
  - 401 Unauthorized: si no se proporciona token o es inválido
  - 500 Internal Server Error: si hay error en el servidor

    4.5 PUT /api/recetas/:id

- Método: PUT
- Path: /api/recetas/:id
- Auth: Sí (Authorization: Bearer <token>)
- Descripción: Actualiza una receta existente. Solo el propietario puede actualizar su propia receta.
- Cuerpo (JSON) ejemplo:
  ```json
  {
    "name": "Tarta de manzana mejorada",
    "description": "Versión actualizada de la receta",
    "steps": ["Paso 1 actualizado", "Paso 2 nuevo", "Paso 3 mejorado"],
    "ingredients": ["manzana", "harina", "azúcar", "canela nueva"],
    "imageUrl": "https://ejemplo.com/tarta-manzana-mejorada.jpg",
    "is_public": true
  }
  ```
- Campos:
  - Todos los campos son **opcionales** (actualización parcial)
  - `name`: título de la receta (mínimo 3 caracteres si se envía)
  - `description`: descripción (no puede estar vacía si se envía)
  - `steps`: array de pasos (mínimo 1 elemento si se envía)
  - `ingredients`: array de ingredientes (mínimo 1 elemento si se envía)
  - `imageUrl`: URL de la imagen de la receta (debe ser http/https, máximo 2000 caracteres)
  - `is_public`: visibilidad de la receta
- Ejemplo de llamada:
  ```bash
  # Actualizar solo el título y descripción
  curl -X PUT http://localhost:3000/api/recetas/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_access_token>" \
  -d '{"name":"Nuevo título","description":"Nueva descripción"}'
  ```
- Respuestas:

  - 200 OK: receta actualizada (objeto JSON completo)
  - 400 Bad Request: datos inválidos o errores de validación
    ```json
    {
      "errors": [
        {
          "msg": "El título (name) debe tener al menos 3 caracteres.",
          "param": "name"
        },
        {
          "msg": "La descripción no puede estar vacía.",
          "param": "description"
        }
      ]
    }
    ```
  - 401 Unauthorized: token inválido
  - 403 Forbidden: no eres propietario de la receta
  - 404 Not Found: receta no existe
  - 500 Internal Server Error: error del servidor

    4.6 DELETE /api/recetas/:id

- Método: DELETE
- Path: /api/recetas/:id
- Auth: Sí (Authorization: Bearer <token>)
- Descripción: Elimina una receta por su ID. Solo el propietario puede eliminar su propia receta.
- Ejemplo de llamada:
  ```bash
  curl -X DELETE http://localhost:3000/api/recetas/123 \
  -H "Authorization: Bearer <tu_access_token>"
  ```
- Respuestas:
  - 204 No Content: receta eliminada exitosamente
  - 400 Bad Request: ID inválido
    ```json
    {
      "errors": [{ "msg": "El ID debe ser un número válido.", "param": "id" }]
    }
    ```
  - 401 Unauthorized: token inválido
  - 403 Forbidden: no eres propietario de la receta
  - 404 Not Found: receta no existe
  - 500 Internal Server Error: error del servidor

---

5. Debug endpoint (dev only)

5.1 POST /api/debug/recetas

- Método: POST
- Path: /api/debug/recetas
- Auth: no (pero puede requerir header `x-debug-key` si `DEBUG_KEY` está configurado)
- Requisitos: `process.env.DATABASE_URL` debe estar configurada (este endpoint conecta directamente a Postgres y bypass RLS)
- Headers: opcional `x-debug-key: <DEBUG_KEY>` si lo configuras
- Cuerpo (JSON) ejemplo:
  {
  "name": "Receta prueba",
  "description": "insertada via debug",
  "steps": [],
  "ingredients": [],
  "userId": "<uuid de auth.user>",
  "is_public": true
  }
- Respuesta:
  - 201 Created: devuelve la fila insertada directamente desde Postgres
  - 400 si falta name o userId
  - 401 si `DEBUG_KEY` configurado y header distinto
  - 500 si error SQL
- Uso: útil para insertar elementos de prueba si RLS o Auth impiden escrito por la API normal.

---

6. Notas operativas y errores comunes

- Si `register` falla con `user_already_exists` significa el email ya está en `auth.users`.
- Si `register` falla con `email_provider_disabled` debes habilitar el provider Email en Supabase Dashboard (Authentication → Providers → Email).
- Si las recetas no se persisten desde la API: revisar que la app tenga `SUPABASE_SERVICE_ROLE_KEY` configurada para que el repo use `supabaseAdmin` y bypass RLS; alternativa temporal: usar `/api/debug/recetas`.
- Para desarrollo, puedes usar `/api/auth/register-test` y `/api/auth/login-test` (simulan registro/login sin tocar Supabase).

---

7. Ejemplos curl

- Register con nombre (actualizado):

  ```bash
  curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana García","email":"ana@example.com","password":"Secret123!"}'
  ```

- Login (real):

  ```bash
  curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@example.com","password":"Secret123!"}'
  ```

- Create recipe (using token):

  ```bash
  curl -X POST http://localhost:3000/api/recetas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name":"Test","description":"...","steps":[],"ingredients":[],"imageUrl":"https://ejemplo.com/receta.jpg","is_public":true}'
  ```

- Get my recipes:

  ```bash
  curl -X GET http://localhost:3000/api/recetas/mis-recetas \
  -H "Authorization: Bearer <access_token>"
  ```

- Update recipe with image:

  ```bash
  curl -X PUT http://localhost:3000/api/recetas/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"name":"Nueva receta con imagen","imageUrl":"https://cdn.ejemplo.com/nueva-foto.jpg"}'
  ```

- Remove image from recipe:

  ```bash
  curl -X PUT http://localhost:3000/api/recetas/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{"imageUrl":null}'
  ```

- Debug insert (direct DB):
  ```bash
  curl -X POST http://localhost:3000/api/debug/recetas \
  -H "Content-Type: application/json" \
  -d '{"name":"Debug","userId":"402fb640-3b5d-4653-a585-5c95256bcb18","imageUrl":"https://debug.com/imagen.jpg"}'
  ```

---

8. Contacto rápido
   Si quieres, puedo:

- Generar un collection de Postman/Insomnia con todas estas peticiones (incluye tests para guardar token)
- Añadir ejemplos concretos con responses reales que obtuvimos en los tests
- Añadir un script para crear un usuario de pruebas en `public.users` y en `auth.users` (requiere service role)

Fin del documento.
