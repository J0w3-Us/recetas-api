// tests/5-test-api-endpoints.js
// Prueba los endpoints POST y GET de la API para verificar persistencia

const http = require('http');

console.log('🔍 Test 5: Endpoints POST/GET de la API');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const parsed = responseData ? JSON.parse(responseData) : {};
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (data && method !== 'GET') {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testApiEndpoints() {
    try {
        console.log('⏳ Verificando que el servidor esté corriendo...');

        // Test 1: Verificar que el servidor responde
        const configResponse = await makeRequest('GET', '/api/config');
        if (configResponse.status !== 200) {
            throw new Error(`Servidor no responde en ${BASE_URL} (status: ${configResponse.status})`);
        }
        console.log('✅ Servidor corriendo en:', configResponse.data);

        // Test 2: Listar recetas existentes
        console.log('⏳ Obteniendo lista de recetas...');
        const listResponse = await makeRequest('GET', '/api/recetas');
        console.log(`📋 GET /api/recetas - Status: ${listResponse.status}`);
        if (listResponse.status === 200) {
            console.log(`📊 Recetas encontradas: ${Array.isArray(listResponse.data) ? listResponse.data.length : 'N/A'}`);
            if (Array.isArray(listResponse.data) && listResponse.data.length > 0) {
                console.log('📝 Primera receta:', listResponse.data[0]);
            }
        } else {
            console.log('❌ Error obteniendo recetas:', listResponse.data);
        }

        // Test 3: Crear nueva receta
        console.log('⏳ Intentando crear nueva receta...');
        const newRecipe = {
            name: `API Test Recipe ${Date.now()}`,
            description: 'Receta creada via API para test de persistencia',
            steps: ['Paso 1', 'Paso 2'],
            ingredients: ['ingrediente1', 'ingrediente2'],
            userId: '402fb640-3b5d-4653-a585-5c95256bcb18' // Usuario conocido
        };

        const createResponse = await makeRequest('POST', '/api/recetas', newRecipe);
        console.log(`📤 POST /api/recetas - Status: ${createResponse.status}`);
        if (createResponse.status === 200 || createResponse.status === 201) {
            console.log('✅ Receta creada:', createResponse.data);
            var createdRecipeId = createResponse.data.id;
        } else {
            console.log('❌ Error creando receta:', createResponse.data);
            console.log('🔧 Esto podría indicar problema con el repositorio o RLS');
        }

        // Test 4: Si se creó la receta, verificar que persiste
        if (createdRecipeId) {
            console.log('⏳ Verificando que la receta persiste...');
            const getResponse = await makeRequest('GET', `/api/recetas/${createdRecipeId}`);
            console.log(`📥 GET /api/recetas/${createdRecipeId} - Status: ${getResponse.status}`);
            if (getResponse.status === 200) {
                console.log('✅ Receta encontrada después de crear:', getResponse.data);
            } else {
                console.log('❌ Receta no encontrada después de crear - problema de persistencia');
            }
        }

        // Test 5: Probar endpoint de debug si está disponible
        console.log('⏳ Probando endpoint de debug...');
        const debugData = {
            name: `Debug Test Recipe ${Date.now()}`,
            description: 'Test via debug endpoint',
            steps: [],
            ingredients: [],
            userId: '402fb640-3b5d-4653-a585-5c95256bcb18'
        };

        const debugResponse = await makeRequest('POST', '/api/debug/recetas', debugData);
        console.log(`🔧 POST /api/debug/recetas - Status: ${debugResponse.status}`);
        if (debugResponse.status === 200 || debugResponse.status === 201) {
            console.log('✅ Debug endpoint funciona:', debugResponse.data);
        } else if (debugResponse.status === 404) {
            console.log('⚠️ Debug endpoint no disponible (DATABASE_URL no configurada)');
        } else {
            console.log('❌ Error en debug endpoint:', debugResponse.data);
        }

        console.log('🎉 Test 5 completado - Revisa los resultados arriba');

    } catch (err) {
        console.error('❌ Test 5 FALLIDO:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.log('🔧 Solución: Arranca el servidor con "node src/app.js"');
        }
        process.exit(1);
    }
}

testApiEndpoints();