# 🔧 Solución de Problemas JWT - GET vs POST

## ✅ DIAGNÓSTICO CONFIRMADO

El backend **SÍ usa el mismo middleware JWT** para todos los endpoints:

```javascript
// TODOS estos endpoints usan authMiddleware:
router.get('/', authMiddleware, recetaController.getAll);          // ✅
router.post('/', authMiddleware, recetaController.create);         // ✅
router.get('/:id', authMiddleware, recetaController.getById);      // ✅
router.put('/:id', authMiddleware, recetaController.updateById);   // ✅
router.delete('/:id', authMiddleware, recetaController.deleteById); // ✅
```

## 🐛 CAUSAS PROBABLES DEL PROBLEMA

### 1. **Token Expirado entre Llamadas**
```dart
// Problema común en Flutter:
final token = await storage.read(key: 'token');  // Token guardado hace días
// El token puede haber expirado entre el GET y el POST
```

**Solución:**
```dart
// Verifica validez antes de cada llamada importante
Future<String> getValidToken() async {
  final token = await storage.read(key: 'token');
  
  // Test rápido con un endpoint que funciona
  final testResponse = await dio.get('/api/config', 
    options: Options(headers: {'Authorization': 'Bearer $token'})
  );
  
  if (testResponse.statusCode != 200) {
    // Token expirado - hacer login nuevamente
    await refreshToken();  // o relogin()
    return await storage.read(key: 'token');
  }
  
  return token;
}
```

### 2. **Diferentes Headers entre Llamadas**
```dart
// ❌ INCORRECTO - headers inconsistentes:
await dio.get('/api/recetas');  // Sin headers? O headers diferentes?

await dio.post('/api/recetas', 
  data: {...},
  options: Options(headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json'  // Este header extra puede causar diferencias
  })
);
```

**Solución:**
```dart
// ✅ CORRECTO - headers consistentes:
final headers = {'Authorization': 'Bearer $token'};

await dio.get('/api/recetas', options: Options(headers: headers));
await dio.post('/api/recetas', data: {...}, options: Options(headers: headers));
```

### 3. **Interceptor que Modifica Tokens**
```dart
// Problema en interceptor de Dio:
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) {
    if (options.method == 'POST') {
      options.headers['Authorization'] = 'Bearer $differentToken';  // ❌
    }
    handler.next(options);
  }
));
```

### 4. **Base URL Diferente**
```dart
// ❌ Problema sutil:
final getResponse = await dio.get('http://localhost:3000/api/recetas');     // ✅ Funciona
final postResponse = await dio.post('https://production.com/api/recetas');  // ❌ Servidor diferente
```

## 🔧 CÓMO DEBUGGEAR

### Paso 1: Verificar Token Activo
```bash
# Test manual con el mismo token:
curl -X GET http://localhost:3000/api/recetas \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

curl -X POST http://localhost:3000/api/recetas \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test","steps":["test"],"ingredients":["test"]}'
```

### Paso 2: Comparar Headers Exactos
```dart
// Añadir logs en Flutter:
dio.interceptors.add(LogInterceptor(
  requestHeader: true,
  responseHeader: true,
  logPrint: (object) => print('🔍 DIO LOG: $object')
));

// Comparar los headers exactos entre GET y POST
```

### Paso 3: Verificar Timestamp del Token
```javascript
// Decodificar JWT para ver expiración:
function decodeJWT(token) {
  const payload = token.split('.')[1];
  const decoded = JSON.parse(atob(payload));
  console.log('Token expira:', new Date(decoded.exp * 1000));
  console.log('Ahora:', new Date());
}
```

## 💡 SOLUCIONES RÁPIDAS

### Solución 1: Regenerar Token Fresco
```dart
Future<void> ensureFreshToken() async {
  // Hacer login nuevamente antes de operaciones críticas
  final loginResponse = await dio.post('/api/auth/login', data: {
    'email': userEmail,
    'password': userPassword
  });
  
  final newToken = loginResponse.data['session']['access_token'];
  await storage.write(key: 'token', value: newToken);
}
```

### Solución 2: Wrapper Consistente
```dart
class ApiService {
  Future<Options> _getAuthOptions() async {
    final token = await storage.read(key: 'token');
    return Options(headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json'
    });
  }

  Future<Response> getRecetas() async {
    return dio.get('/api/recetas', options: await _getAuthOptions());
  }

  Future<Response> createReceta(Map<String, dynamic> data) async {
    return dio.post('/api/recetas', data: data, options: await _getAuthOptions());
  }
}
```

### Solución 3: Test de Consistencia
```dart
Future<void> testConsistency() async {
  final token = await storage.read(key: 'token');
  print('🔑 Token: ${token?.substring(0, 20)}...');

  // Test GET
  try {
    final getResponse = await dio.get('/api/recetas', 
      options: Options(headers: {'Authorization': 'Bearer $token'})
    );
    print('✅ GET funciona: ${getResponse.statusCode}');
  } catch (e) {
    print('❌ GET falló: $e');
  }

  // Test POST con el MISMO token
  try {
    final postResponse = await dio.post('/api/recetas', 
      data: {"name":"Test","description":"Test","steps":["test"],"ingredients":["test"]},
      options: Options(headers: {'Authorization': 'Bearer $token'})
    );
    print('✅ POST funciona: ${postResponse.statusCode}');
  } catch (e) {
    print('❌ POST falló: $e');
  }
}
```

## 🎯 CONCLUSIÓN

El problema **NO está en el backend** (todos los endpoints usan la misma validación JWT).

**Revisar en el frontend:**
1. ¿Mismo token para ambas llamadas?
2. ¿Mismo base URL?
3. ¿Headers idénticos?
4. ¿Token no expirado?

**Test rápido:**
```bash
# Si estos dos comandos dan diferentes resultados, 
# entonces hay problema de configuración externa
curl -H "Authorization: Bearer TOKEN" GET /api/recetas
curl -H "Authorization: Bearer TOKEN" POST /api/recetas -d '{...}'
```