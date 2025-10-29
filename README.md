# 📱 Recetas API

API Backend para aplicación de recetas desarrollada en Node.js con Express y Supabase.

## 🚀 Características Principales

- ✅ **Autenticación JWT** con Supabase Auth
- ✅ **CRUD completo** de recetas (crear, leer, actualizar, eliminar)
- ✅ **Validación robusta** con express-validator
- ✅ **Soporte para imágenes** (URLs de imágenes en recetas)
- ✅ **Control de permisos** (usuarios solo pueden editar sus propias recetas)
- ✅ **Base de datos PostgreSQL** con Supabase
- ✅ **Clean Architecture** (entidades, use-cases, repositorios)

## 📋 API Endpoints - Guía Completa para Frontend

### 🔐 Autenticación (No requiere Bearer token)

#### `POST /api/auth/register`

Registra un nuevo usuario en Supabase Auth.

```bash
# Ejemplo de llamada
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana García",
    "email": "ana@ejemplo.com",
    "password": "MiPassword123!"
  }'
```

**Flutter/Dart:**

```dart
final response = await dio.post('/api/auth/register',
  data: {
    'name': 'Ana García',
    'email': 'ana@ejemplo.com',
    'password': 'MiPassword123!'
  }
);
```

**Respuesta exitosa (201):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "ana@ejemplo.com",
    "user_metadata": { "name": "Ana García" }
  }
}
```

#### `POST /api/auth/login`

Inicia sesión y obtiene el token JWT.

```bash
# Ejemplo de llamada
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana@ejemplo.com",
    "password": "MiPassword123!"
  }'
```

**Flutter/Dart:**

```dart
final response = await dio.post('/api/auth/login',
  data: {
    'email': 'ana@ejemplo.com',
    'password': 'MiPassword123!'
  }
);

// Guardar token para futuras llamadas
final token = response.data['session']['access_token'];
await storage.write(key: 'auth_token', value: token);
```

**Respuesta exitosa (200):**

```json
{
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "xyz123...",
    "expires_in": 3600,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "ana@ejemplo.com"
    }
  }
}
```

### 🍽️ Recetas (Requieren Bearer token)

> **⚠️ IMPORTANTE**: Todos los endpoints de recetas requieren el header:
> `Authorization: Bearer tu_access_token`

#### `GET /api/recetas`

Lista todas las recetas públicas.

```bash
curl -X GET http://localhost:3000/api/recetas \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Flutter/Dart:**

```dart
final token = await storage.read(key: 'auth_token');
final response = await dio.get('/api/recetas',
  options: Options(headers: {'Authorization': 'Bearer $token'})
);
List<Map<String, dynamic>> recetas = List<Map<String, dynamic>>.from(response.data);
```

**Respuesta (200):**

```json
[
  {
    "id": 1,
    "name": "Tarta de manzana",
    "description": "Deliciosa tarta casera",
    "steps": ["Preparar masa", "Añadir manzanas", "Hornear 30min"],
    "ingredients": ["2 tazas harina", "3 manzanas", "1 taza azúcar"],
    "imageUrl": "https://ejemplo.com/tarta.jpg",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2025-10-29T15:30:00Z",
    "is_public": true
  }
]
```

#### `GET /api/recetas/mis-recetas`

Obtiene solo las recetas del usuario autenticado.

```bash
curl -X GET http://localhost:3000/api/recetas/mis-recetas \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Flutter/Dart:**

```dart
final token = await storage.read(key: 'auth_token');
final response = await dio.get('/api/recetas/mis-recetas',
  options: Options(headers: {'Authorization': 'Bearer $token'})
);
// Misma estructura que /api/recetas pero solo recetas del usuario
```

#### `GET /api/recetas/:id`

Obtiene una receta específica por ID.

```bash
curl -X GET http://localhost:3000/api/recetas/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Flutter/Dart:**

```dart
final token = await storage.read(key: 'auth_token');
final response = await dio.get('/api/recetas/$recipeId',
  options: Options(headers: {'Authorization': 'Bearer $token'})
);
Map<String, dynamic> receta = response.data;
```

#### `POST /api/recetas`

Crea una nueva receta.

**Campos requeridos:**

- `name` (string): Título de la receta (mín. 3 caracteres)
- `description` (string): Descripción de la receta
- `steps` (array): Lista de pasos (mín. 1 elemento)
- `ingredients` (array): Lista de ingredientes (mín. 1 elemento)

**Campos opcionales:**

- `imageUrl` (string): URL de imagen (HTTP/HTTPS, máx. 2000 caracteres)
- `is_public` (boolean): Visibilidad pública (default: true)

```bash
curl -X POST http://localhost:3000/api/recetas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "name": "Pasta Carbonara",
    "description": "Receta italiana tradicional",
    "steps": [
      "Hervir pasta al dente",
      "Freír panceta hasta dorar",
      "Mezclar huevos con queso",
      "Combinar todo fuera del fuego"
    ],
    "ingredients": [
      "400g pasta",
      "200g panceta",
      "3 huevos",
      "100g queso parmesano"
    ],
    "imageUrl": "https://mi-cdn.com/carbonara.jpg",
    "is_public": true
  }'
```

**Flutter/Dart:**

```dart
final token = await storage.read(key: 'auth_token');
final response = await dio.post('/api/recetas',
  data: {
    'name': 'Pasta Carbonara',
    'description': 'Receta italiana tradicional',
    'steps': [
      'Hervir pasta al dente',
      'Freír panceta hasta dorar',
      'Mezclar huevos con queso',
      'Combinar todo fuera del fuego'
    ],
    'ingredients': [
      '400g pasta',
      '200g panceta',
      '3 huevos',
      '100g queso parmesano'
    ],
    'imageUrl': 'https://mi-cdn.com/carbonara.jpg',
    'is_public': true
  },
  options: Options(headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json'
  })
);
```

#### `PUT /api/recetas/:id`

Actualiza una receta existente (solo el propietario).

**Todos los campos son opcionales** - actualización parcial permitida.

```bash
# Actualizar solo imagen y descripción
curl -X PUT http://localhost:3000/api/recetas/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "description": "Nueva descripción mejorada",
    "imageUrl": "https://nueva-imagen.com/foto.jpg"
  }'
```

**Flutter/Dart:**

```dart
// Actualización parcial - solo cambiar imagen
final response = await dio.put('/api/recetas/$recipeId',
  data: {
    'imageUrl': 'https://nueva-imagen.com/foto.jpg'
  },
  options: Options(headers: {'Authorization': 'Bearer $token'})
);

// Actualización completa
final response = await dio.put('/api/recetas/$recipeId',
  data: {
    'name': 'Nuevo título',
    'description': 'Nueva descripción',
    'steps': ['Nuevo paso 1', 'Nuevo paso 2'],
    'ingredients': ['Nuevo ingrediente 1'],
    'imageUrl': 'https://nueva-imagen.com/foto.jpg'
  },
  options: Options(headers: {'Authorization': 'Bearer $token'})
);
```

#### `DELETE /api/recetas/:id`

Elimina una receta (solo el propietario).

```bash
curl -X DELETE http://localhost:3000/api/recetas/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

**Flutter/Dart:**

```dart
final response = await dio.delete('/api/recetas/$recipeId',
  options: Options(headers: {'Authorization': 'Bearer $token'})
);
// Respuesta 204 (No Content) = eliminación exitosa
```

### ℹ️ Información General

#### `GET /`

Estado de la API (no requiere autenticación).

#### `GET /api/config`

Configuración pública del servidor.

## 🛠️ Configuración e Instalación

### Requisitos

- Node.js 16+
- Cuenta en [Supabase](https://supabase.com)
- Variables de entorno configuradas

### Instalación

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/J0w3-Us/recetas-api.git
   cd recetas-api
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Crear archivo `src/.env` con:

   ```env
   SUPABASE_URL=tu_supabase_url
   SUPABASE_ANON_KEY=tu_anon_key
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
   DATABASE_URL=postgresql://usuario:password@host:5432/database
   JWT_SECRET=tu_jwt_secret_super_seguro
   ```

4. **Aplicar migraciones de base de datos**

   Ejecutar los scripts SQL en `database/` en tu Supabase Dashboard:

   - `001_create_recipes_with_recommendations.sql` (crear tabla recetas)
   - `002_create_users.sql` (crear tabla usuarios)
   - `003_add_image_url_to_recipes.sql` (añadir soporte para imágenes)

5. **Ejecutar la aplicación**

   ```bash
   # Desarrollo
   npm run dev

   # Producción
   npm start
   ```

La API estará disponible en `http://localhost:3000`

## �️ Integración con Supabase

### Estructura de Base de Datos

La API utiliza **PostgreSQL en Supabase** con las siguientes tablas:

#### Tabla `auth.users` (Supabase Auth)

Gestiona automáticamente:

- Registro de usuarios
- Autenticación JWT
- Metadata del usuario (nombre, email)

#### Tabla `public.recipes`

```sql
CREATE TABLE public.recipes (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB,                 -- Array de pasos como JSON
  ingredients JSONB,           -- Array de ingredientes como JSON
  image_url TEXT,              -- ✨ URL de imagen opcional
  user_id UUID NOT NULL,       -- Referencia a auth.users
  is_public BOOLEAN DEFAULT true,

  -- Relación con usuarios de Supabase Auth
  CONSTRAINT fk_user FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX idx_recipes_image_url ON public.recipes(image_url)
  WHERE image_url IS NOT NULL;
```

### 🔒 Row Level Security (RLS)

Supabase aplica automáticamente estas políticas de seguridad:

```sql
-- Solo leer recetas públicas o propias
CREATE POLICY "Select public or own recipes" ON public.recipes
  FOR SELECT TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

-- Solo crear recetas propias
CREATE POLICY "Insert own recipes only" ON public.recipes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Solo actualizar recetas propias
CREATE POLICY "Update own recipes only" ON public.recipes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Solo eliminar recetas propias
CREATE POLICY "Delete own recipes only" ON public.recipes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

### 🔄 Flujo de Datos API → Supabase

```
Frontend Request → Express API → Supabase Auth (validar JWT) → PostgreSQL
                               ↓
Response ← JSON Mapping ← Supabase Response ← Row Level Security
```

**Ejemplo del flujo:**

1. **Frontend envía:**

   ```json
   POST /api/recetas
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   {
     "name": "Tarta de manzana",
     "ingredients": ["harina", "manzanas"]
   }
   ```

2. **API valida JWT** con Supabase y extrae `user_id`

3. **API inserta en PostgreSQL:**

   ```sql
   INSERT INTO public.recipes (name, ingredients, user_id, image_url)
   VALUES ('Tarta de manzana', '["harina", "manzanas"]', 'uuid-del-usuario', NULL);
   ```

4. **Supabase RLS** verifica que `user_id` coincide con `auth.uid()`

5. **API responde:**
   ```json
   {
     "id": 123,
     "name": "Tarta de manzana",
     "ingredients": ["harina", "manzanas"],
     "imageUrl": null,
     "userId": "uuid-del-usuario",
     "createdAt": "2025-10-29T15:30:00Z"
   }
   ```

## 🧪 Scripts Disponibles

- `npm start` - Ejecutar en producción
- `npm run dev` - Ejecutar en desarrollo (con nodemon)
- `npm run seed:recetas` - Insertar recetas de ejemplo
- `npm run test:integration` - Ejecutar tests de integración

## � Guía de Integración Frontend

### 🔐 Manejo de Autenticación

#### 1. Setup inicial en Flutter

```dart
class ApiService {
  final Dio dio = Dio();
  final FlutterSecureStorage storage = FlutterSecureStorage();

  ApiService() {
    dio.options.baseUrl = 'http://localhost:3000'; // o tu URL de producción
    dio.options.headers['Content-Type'] = 'application/json';
  }

  Future<String?> getAuthToken() async {
    return await storage.read(key: 'auth_token');
  }

  Future<Options> getAuthOptions() async {
    final token = await getAuthToken();
    return Options(headers: {'Authorization': 'Bearer $token'});
  }
}
```

#### 2. Flujo de Login Completo

```dart
class AuthService extends ApiService {
  Future<bool> login(String email, String password) async {
    try {
      final response = await dio.post('/api/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200) {
        final token = response.data['session']['access_token'];
        await storage.write(key: 'auth_token', value: token);

        // Guardar info del usuario
        final user = response.data['session']['user'];
        await storage.write(key: 'user_id', value: user['id']);
        await storage.write(key: 'user_email', value: user['email']);

        return true;
      }
    } catch (e) {
      print('Error en login: $e');
    }
    return false;
  }

  Future<void> logout() async {
    await storage.deleteAll();
  }
}
```

### 🍽️ Manejo de Recetas

#### 1. Servicio de Recetas Completo

```dart
class RecetasService extends ApiService {
  // Obtener todas las recetas públicas
  Future<List<Receta>> getRecetas() async {
    try {
      final response = await dio.get('/api/recetas',
        options: await getAuthOptions()
      );

      return (response.data as List)
          .map((json) => Receta.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Error al cargar recetas: $e');
    }
  }

  // Obtener mis recetas
  Future<List<Receta>> getMisRecetas() async {
    try {
      final response = await dio.get('/api/recetas/mis-recetas',
        options: await getAuthOptions()
      );

      return (response.data as List)
          .map((json) => Receta.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Error al cargar mis recetas: $e');
    }
  }

  // Crear nueva receta
  Future<Receta> crearReceta({
    required String name,
    required String description,
    required List<String> steps,
    required List<String> ingredients,
    String? imageUrl,
    bool isPublic = true,
  }) async {
    try {
      final response = await dio.post('/api/recetas',
        data: {
          'name': name,
          'description': description,
          'steps': steps,
          'ingredients': ingredients,
          if (imageUrl != null) 'imageUrl': imageUrl,
          'is_public': isPublic,
        },
        options: await getAuthOptions()
      );

      return Receta.fromJson(response.data);
    } catch (e) {
      if (e is DioException && e.response?.statusCode == 400) {
        final errors = e.response?.data['errors'] as List?;
        final errorMessages = errors?.map((e) => e['msg']).join(', ') ?? 'Datos inválidos';
        throw Exception('Error de validación: $errorMessages');
      }
      throw Exception('Error al crear receta: $e');
    }
  }

  // Actualizar receta existente
  Future<Receta> actualizarReceta(int id, {
    String? name,
    String? description,
    List<String>? steps,
    List<String>? ingredients,
    String? imageUrl,
    bool? isPublic,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (name != null) data['name'] = name;
      if (description != null) data['description'] = description;
      if (steps != null) data['steps'] = steps;
      if (ingredients != null) data['ingredients'] = ingredients;
      if (imageUrl != null) data['imageUrl'] = imageUrl;
      if (isPublic != null) data['is_public'] = isPublic;

      final response = await dio.put('/api/recetas/$id',
        data: data,
        options: await getAuthOptions()
      );

      return Receta.fromJson(response.data);
    } catch (e) {
      if (e is DioException) {
        if (e.response?.statusCode == 403) {
          throw Exception('No tienes permisos para editar esta receta');
        }
        if (e.response?.statusCode == 404) {
          throw Exception('Receta no encontrada');
        }
      }
      throw Exception('Error al actualizar receta: $e');
    }
  }

  // Eliminar receta
  Future<bool> eliminarReceta(int id) async {
    try {
      final response = await dio.delete('/api/recetas/$id',
        options: await getAuthOptions()
      );

      return response.statusCode == 204;
    } catch (e) {
      if (e is DioException) {
        if (e.response?.statusCode == 403) {
          throw Exception('No tienes permisos para eliminar esta receta');
        }
        if (e.response?.statusCode == 404) {
          throw Exception('Receta no encontrada');
        }
      }
      throw Exception('Error al eliminar receta: $e');
    }
  }
}
```

#### 2. Modelo de Datos

```dart
class Receta {
  final int id;
  final String name;
  final String description;
  final List<String> steps;
  final List<String> ingredients;
  final String? imageUrl;
  final String userId;
  final DateTime createdAt;
  final bool isPublic;

  Receta({
    required this.id,
    required this.name,
    required this.description,
    required this.steps,
    required this.ingredients,
    this.imageUrl,
    required this.userId,
    required this.createdAt,
    required this.isPublic,
  });

  factory Receta.fromJson(Map<String, dynamic> json) {
    return Receta(
      id: json['id'],
      name: json['name'],
      description: json['description'],
      steps: List<String>.from(json['steps']),
      ingredients: List<String>.from(json['ingredients']),
      imageUrl: json['imageUrl'],
      userId: json['userId'],
      createdAt: DateTime.parse(json['createdAt']),
      isPublic: json['is_public'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'steps': steps,
      'ingredients': ingredients,
      'imageUrl': imageUrl,
      'userId': userId,
      'createdAt': createdAt.toIso8601String(),
      'is_public': isPublic,
    };
  }
}
```

### 🛡️ Manejo de Errores

```dart
class ApiErrorHandler {
  static String handleError(dynamic error) {
    if (error is DioException) {
      switch (error.response?.statusCode) {
        case 400:
          final errors = error.response?.data['errors'] as List?;
          if (errors != null) {
            return errors.map((e) => e['msg']).join('\n');
          }
          return 'Datos inválidos';
        case 401:
          return 'Token expirado. Inicia sesión nuevamente';
        case 403:
          return 'No tienes permisos para esta acción';
        case 404:
          return 'Recurso no encontrado';
        case 500:
          return 'Error del servidor. Inténtalo más tarde';
        default:
          return 'Error de conexión';
      }
    }
    return 'Error desconocido: $error';
  }
}
```

## 🏗️ Arquitectura del Proyecto

```
src/
├── api/
│   ├── controllers/     # Controladores HTTP
│   ├── middlewares/     # Middlewares (auth, validación)
│   └── routes/         # Definición de rutas
├── config/             # Configuración general
├── core/
│   └── db/             # Conexiones a base de datos
├── data/
│   ├── models/         # Modelos de datos
│   └── repositories/   # Repositorios (acceso a datos)
└── domain/
    ├── entities/       # Entidades de dominio
    ├── repositories/   # Interfaces de repositorios
    └── use-cases/      # Casos de uso (lógica de negocio)
```

## 🔒 Seguridad

- ✅ Autenticación JWT con Supabase
- ✅ Validación de entrada con express-validator
- ✅ Control de permisos por usuario
- ✅ Variables de entorno para credenciales
- ✅ Row Level Security (RLS) en Supabase

## 🤝 Compatibilidad con Frontend

Esta API está diseñada para funcionar perfectamente con aplicaciones Flutter y otras tecnologías frontend modernas.

**Ejemplo en Flutter/Dart:**

```dart
// Crear receta
final response = await dio.post('/api/recetas',
  data: {
    'name': 'Mi receta',
    'description': 'Descripción',
    'steps': ['Paso 1'],
    'ingredients': ['Ingrediente 1'],
    'imageUrl': 'https://mi-imagen.com/foto.jpg'
  },
  options: Options(headers: {'Authorization': 'Bearer $token'})
);
```

## 📝 Documentación Adicional

- `database/README.md` - Guía de migraciones de base de datos

## � Validaciones y Restricciones

### Validaciones de Campos

| Campo         | Tipo    | Requerido | Validación                               |
| ------------- | ------- | --------- | ---------------------------------------- |
| `name`        | string  | Sí (POST) | Mín. 3 caracteres                        |
| `description` | string  | Sí (POST) | No puede estar vacío                     |
| `steps`       | array   | Sí (POST) | Mín. 1 elemento                          |
| `ingredients` | array   | Sí (POST) | Mín. 1 elemento                          |
| `imageUrl`    | string  | No        | URL válida (HTTP/HTTPS), máx. 2000 chars |
| `is_public`   | boolean | No        | Default: true                            |

### Códigos de Error HTTP

| Código | Significado        | Acción Frontend               |
| ------ | ------------------ | ----------------------------- |
| `200`  | ✅ Éxito           | Continuar                     |
| `201`  | ✅ Creado          | Mostrar receta creada         |
| `204`  | ✅ Eliminado       | Actualizar lista              |
| `400`  | ❌ Datos inválidos | Mostrar errores de validación |
| `401`  | ❌ Token inválido  | Redirigir a login             |
| `403`  | ❌ Sin permisos    | Mostrar "Acceso denegado"     |
| `404`  | ❌ No encontrado   | Mostrar "Receta no existe"    |
| `500`  | ❌ Error servidor  | Mostrar "Inténtalo más tarde" |

### Ejemplo de Validación en Frontend

```dart
Future<void> validarYCrearReceta() async {
  // Validación local antes de enviar
  if (nameController.text.trim().length < 3) {
    throw Exception('El nombre debe tener al menos 3 caracteres');
  }

  if (stepsController.isEmpty) {
    throw Exception('Debes agregar al menos un paso');
  }

  if (ingredientsController.isEmpty) {
    throw Exception('Debes agregar al menos un ingrediente');
  }

  // Si imageUrl no está vacía, validar formato
  if (imageUrlController.text.isNotEmpty &&
      !imageUrlController.text.startsWith(RegExp(r'https?://'))) {
    throw Exception('La URL de imagen debe empezar con http:// o https://');
  }

  try {
    final receta = await recetasService.crearReceta(
      name: nameController.text.trim(),
      description: descriptionController.text.trim(),
      steps: stepsController.toList(),
      ingredients: ingredientsController.toList(),
      imageUrl: imageUrlController.text.isEmpty ? null : imageUrlController.text,
    );

    // Éxito - navegar o actualizar UI
    Navigator.pop(context, receta);
  } catch (e) {
    // Mostrar error al usuario
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(ApiErrorHandler.handleError(e)))
    );
  }
}
```

## 🐛 Troubleshooting Común

### 1. Error 401 - Token Inválido

**Síntoma**: GET funciona pero POST da 401

**Causas posibles:**

- Token expirado entre llamadas
- Headers inconsistentes
- Interceptors que modifican tokens

**Solución:**

```dart
// Verificar token antes de cada llamada crítica
Future<bool> isTokenValid() async {
  try {
    await dio.get('/api/config', options: await getAuthOptions());
    return true;
  } catch (e) {
    if (e is DioException && e.response?.statusCode == 401) {
      await storage.delete(key: 'auth_token');
      return false;
    }
    return true; // Otro tipo de error, asumir token válido
  }
}

Future<void> crearRecetaSegura(RecetaData data) async {
  if (!await isTokenValid()) {
    // Redirigir a login
    Navigator.pushReplacementNamed(context, '/login');
    return;
  }

  await crearReceta(data);
}
```

### 2. Error 400 - Validación

**Síntoma**: Campos parecen correctos pero da error 400

**Revisar:**

- Arrays vacíos en `steps` o `ingredients`
- Strings vacíos después de `.trim()`
- URLs malformadas en `imageUrl`

### 3. Error 403 - Permisos

**Síntoma**: Solo al editar/eliminar recetas

**Causa**: Usuario intenta modificar receta de otro usuario

**Solución**:

```dart
bool puedeEditar(Receta receta, String currentUserId) {
  return receta.userId == currentUserId;
}

// En UI
if (puedeEditar(receta, await storage.read(key: 'user_id'))) {
  // Mostrar botones de editar/eliminar
} else {
  // Ocultar botones o mostrar como solo lectura
}
```

### 4. Problemas de Conectividad

**Para desarrollo local:**

```dart
// iOS Simulator
dio.options.baseUrl = 'http://localhost:3000';

// Android Emulator
dio.options.baseUrl = 'http://10.0.2.2:3000';

// Dispositivo físico (usar IP de tu computadora)
dio.options.baseUrl = 'http://192.168.1.100:3000';
```

## 📞 Contacto

- **Repositorio**: [github.com/J0w3-Us/recetas-api](https://github.com/J0w3-Us/recetas-api)
- **Issues**: [Reportar problemas](https://github.com/J0w3-Us/recetas-api/issues)

---

**¡API lista para usar con tu aplicación de recetas!** 🚀
