const { spawn } = require('child_process');
const fetch = global.fetch || require('node-fetch');
const assert = require('assert');

// Configuración
const SERVER_PORT = process.env.TEST_PORT || 4010;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const SERVER_START_TIMEOUT = 15000; // ms

// Lanzar el servidor como proceso hijo con env overrides
function startServer() {
    return new Promise((resolve, reject) => {
        // Clone env but force SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to be undefined
        const env = Object.assign({}, process.env);
        env.PORT = SERVER_PORT;
        delete env.SUPABASE_ANON_KEY;
        delete env.SUPABASE_SERVICE_ROLE_KEY;
        delete env.SERVICE_ROLE_KEY;

        const child = spawn(process.execPath, ['src/app.js'], { env, stdio: ['ignore', 'pipe', 'pipe'] });

        let started = false;

        const onData = (data) => {
            const txt = String(data);
            process.stdout.write(txt);
            if (!started && txt.includes('Servidor escuchando')) {
                started = true;
                resolve({ child });
            }
        };

        child.stdout.on('data', onData);
        child.stderr.on('data', onData);

        const timeout = setTimeout(() => {
            if (!started) {
                child.kill('SIGKILL');
                reject(new Error('Timeout esperando a que el servidor arranque'));
            }
        }, SERVER_START_TIMEOUT);

        // Ensure we clear on resolve/reject
        const cleanupResolve = (val) => {
            clearTimeout(timeout);
            return val;
        };

        // Wrap resolve/reject so we clear timeout
        const origResolve = resolve;
        resolve = (v) => origResolve(cleanupResolve(v));
        const origReject = reject;
        reject = (e) => origReject((clearTimeout(timeout), e));
    });
}

async function waitForUrl(path, attempts = 20, delay = 200) {
    for (let i = 0; i < attempts; i++) {
        try {
            const res = await fetch(`${SERVER_URL}${path}`);
            if (res.ok) return res;
        } catch (e) {
            // ignore
        }
        await new Promise((r) => setTimeout(r, delay));
    }
    throw new Error(`No se pudo alcanzar ${path} en ${SERVER_URL}`);
}

async function runTests() {
    console.log('🔬 Iniciando servidor de pruebas...');
    const { child } = await startServer();

    try {
        console.log('⏳ Esperando /api/config ...');
        await waitForUrl('/api/config');
        console.log('✅ Servidor listo, ejecutando tests...');

        // 1) Test valid payload (igual al front) contra la ruta de test (/api/recetas-test)
        const validPayload = {
            name: 'Test desde frontend - Valida',
            description: 'Descripción de prueba desde test',
            steps: ['Paso 1', 'Paso 2'],
            ingredients: ['ingrediente A', 'ingrediente B'],
            is_public: true
        };

        // Directly use /api/recetas-test (test-only endpoint that injects req.user)
        let createRes = await fetch(`${SERVER_URL}/api/recetas-test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validPayload)
        });

        if (createRes.status !== 201) {
            const text = await createRes.text();
            throw new Error(`Creación válida falló: status=${createRes.status} body=${text}`);
        }
        const created = await createRes.json();
        console.log('✅ Creación válida OK, receta creada:', created);

        // 2) Test invalid payloads: missing fields
        const invalidPayloads = [
            { name: '', description: '', steps: [], ingredients: [] },
            { name: 'ab', description: 'short', steps: ['only'], ingredients: [] },
            { /* empty body */ }
        ];

        for (const p of invalidPayloads) {
            const r = await fetch(`${SERVER_URL}/api/recetas-test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(p)
            });
            console.log(`→ Invalid payload status: ${r.status}`);
            assert(r.status === 400, `Expected 400 for invalid payload, got ${r.status}`);
            const body = await r.json();
            console.log('   response body:', body);
            assert(body && (body.errors || body.message), 'Expected validation errors or message');
        }

        console.log('\n🎯 Todos los tests de validación pasaron correctamente.');

    } catch (err) {
        console.error('\n❌ Tests fallaron:', err && err.message ? err.message : err);
        throw err;
    } finally {
        console.log('🧹 Matando proceso del servidor...');
        try { child.kill('SIGKILL'); } catch (e) { /* ignore */ }
    }
}

runTests().catch((err) => {
    console.error('Error en runner:', err);
    process.exit(1);
});
