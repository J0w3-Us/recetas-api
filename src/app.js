// src/app.js
const express = require('express');
const config = require('./config');

// Importaciones de todas nuestras piezas (algunas se cargan de forma condicional)
const CrearRecetaUseCase = require('./domain/use-cases/crear-receta.usecase');
const ObtenerTodasRecetasUseCase = require('./domain/use-cases/obtener-todas-recetas.usecase');
const ObtenerRecetaPorIdUseCase = require('./domain/use-cases/obtener-receta-por-id.usecase');
const ObtenerMisRecetasUseCase = require('./domain/use-cases/obtener-mis-recetas.usecase');
const ActualizarRecetaUseCase = require('./domain/use-cases/actualizar-receta.usecase');
const EliminarRecetaUseCase = require('./domain/use-cases/eliminar-receta.usecase');
const RecetaController = require('./api/controllers/receta.controller');
const createRecetaRouter = require('./api/routes/receta.routes');
// createAuthRouter se cargará condicionalmente (ver más abajo)

// Nota: el cliente de Supabase se inicializa cuando se requiere
// `./data/repositories/supabase-receta.repository`. Si las variables de entorno
// de Supabase faltan, ese módulo lanzará un error al importarlo. Para evitar
// que la app se caiga al arrancar (p. ej. en entornos de desarrollo sin env),
// cargamos el repositorio de forma condicional y proporcionamos un fallback
// en memoria que implementa la misma API mínima.

// --- Función principal ---
function main() {
    const app = express();

    // CORS - permitir solicitudes desde cualquier origen (ajustar en producción)
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    });

    // Configuración de parsing con límites y debugging
    app.use(express.json({
        limit: '10mb',
        strict: false,
        verify: (req, res, buf) => {
            // Debug: log raw body para debugging JSON malformado
            if (buf && buf.length > 0) {
                console.log('Raw body:', buf.toString('utf8'));
            }
        }
    }));

    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Middleware de debugging para requests (mejor formato; evita mostrar 'undefined')
    app.use((req, res, next) => {
        const contentType = req.headers['content-type'] || '-';
        const params = req.params && Object.keys(req.params).length ? JSON.stringify(req.params) : '-';
        const bodyFlag = req.body && Object.keys(req.body).length > 0 ? 'with body' : 'no body';
        console.log(`${req.method} ${req.url} [content-type: ${contentType}] [params: ${params}] ${bodyFlag}`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('Parsed body:', JSON.stringify(req.body, null, 2));
        }
        next();
    });

    // 1. Inicializamos el Repositorio (la capa de datos)
    let recetaRepository;

    if (config.supabaseUrl && config.supabaseAnonKey) {
        // Cargar el repo concreto solo si las credenciales existen
        const SupabaseRecetaRepository = require('./data/repositories/supabase-receta.repository');
        recetaRepository = new SupabaseRecetaRepository();
    } else {
        console.warn('SUPABASE_URL or SUPABASE_ANON_KEY not set — using in-memory fallback repository');

        // Repositorio simple en memoria (fallback para desarrollo/local)
        class MemoryRecetaRepository {
            constructor() {
                this.items = [];
                this.nextId = 1;
            }

            async findById(id) {
                const it = this.items.find((r) => String(r.id) === String(id));
                return it || null;
            }

            async findAll(opts = {}) {
                return this.items.slice().reverse();
            }

            async findByUser(userId, opts = {}) {
                return this.items.filter((r) => r.user_id === userId);
            }

            async searchByIngredient(ingredientName) {
                const needle = String(ingredientName).toLowerCase();
                return this.items.filter((r) => JSON.stringify(r.ingredients || []).toLowerCase().includes(needle));
            }

            async create(recetaProps) {
                const payload = recetaProps || {};
                const rec = Object.assign({}, payload, { id: this.nextId++ });
                this.items.push(rec);
                return rec;
            }

            async update(id, updateProps) {
                const idx = this.items.findIndex((r) => String(r.id) === String(id));
                if (idx === -1) return null;
                this.items[idx] = Object.assign({}, this.items[idx], updateProps);
                return this.items[idx];
            }

            async delete(id) {
                const idx = this.items.findIndex((r) => String(r.id) === String(id));
                if (idx === -1) return false;
                this.items.splice(idx, 1);
                return true;
            }
        }

        recetaRepository = new MemoryRecetaRepository();
    }

    // 2. Inicializamos los Casos de Uso con el repositorio
    const crearRecetaUseCase = new CrearRecetaUseCase(recetaRepository);
    const obtenerTodasRecetasUseCase = new ObtenerTodasRecetasUseCase(recetaRepository);
    const obtenerRecetaPorIdUseCase = new ObtenerRecetaPorIdUseCase(recetaRepository);
    const obtenerMisRecetasUseCase = new ObtenerMisRecetasUseCase(recetaRepository);
    const actualizarRecetaUseCase = new ActualizarRecetaUseCase(recetaRepository);
    const eliminarRecetaUseCase = new EliminarRecetaUseCase(recetaRepository);

    // 3. Inicializamos el Controlador con los casos de uso
    const recetaController = new RecetaController(
        crearRecetaUseCase,
        obtenerTodasRecetasUseCase,
        eliminarRecetaUseCase,
        obtenerRecetaPorIdUseCase,
        obtenerMisRecetasUseCase,
        actualizarRecetaUseCase
    );

    // 4. Creamos y usamos el Router
    const recetaRouter = createRecetaRouter(recetaController);
    app.use('/api/recetas', recetaRouter);

    // Ruta de prueba que omite autenticación pero usa las mismas validaciones
    // Solo en entornos de desarrollo / testing. Esto facilita tests automáticos.
    try {
        const recetaValidation = createRecetaRouter.recetaValidation;
        if (recetaValidation && process.env.NODE_ENV !== 'production') {
            // Montar en /api/recetas-test para permitir pruebas de validación sin auth
            // Esta ruta inyecta un `req.user` de prueba (desde header `x-test-user`) para
            // que el controlador pueda operar sin el middleware real de auth.
            app.post('/api/recetas-test', recetaValidation, (req, res, next) => {
                req.user = { id: req.headers['x-test-user'] || `test_user_${Date.now()}` };
                next();
            }, recetaController.create);
        }
    } catch (e) {
        // no-op
    }

    // Rutas de autenticación: cargamos rutas reales + rutas de prueba
    if (config.supabaseUrl && config.supabaseAnonKey) {
        const createAuthRouter = require('./api/routes/auth.routes');
        const authRouter = createAuthRouter();
        app.use('/api/auth', authRouter);

        // Agregar endpoints de prueba que funcionan sin restricciones de Supabase
        const { Router } = require('express');
        const testRouter = Router();

        testRouter.post('/register-test', async (req, res) => {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({ message: 'Email y password son requeridos' });
                }

                // Simular registro exitoso para pruebas
                const mockUser = {
                    id: 'test_' + Date.now(),
                    email: email,
                    created_at: new Date().toISOString(),
                    email_confirmed_at: new Date().toISOString()
                };

                return res.status(201).json({
                    message: 'Usuario registrado exitosamente (modo test)',
                    user: mockUser
                });
            } catch (err) {
                return res.status(500).json({ message: err.message });
            }
        });

        testRouter.post('/login-test', async (req, res) => {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({ message: 'Email y password son requeridos' });
                }

                // Simular login exitoso
                const mockSession = {
                    access_token: 'test_token_' + Date.now(),
                    token_type: 'bearer',
                    expires_in: 3600,
                    refresh_token: 'test_refresh_' + Date.now(),
                    user: {
                        id: 'test_user_123',
                        email: email,
                        created_at: new Date().toISOString()
                    }
                };

                return res.status(200).json({
                    message: 'Login exitoso (modo test)',
                    session: mockSession
                });
            } catch (err) {
                return res.status(500).json({ message: err.message });
            }
        });

        app.use('/api/auth', testRouter);
    } else {
        const { Router } = require('express');
        const authFallback = Router();
        authFallback.post('/register', (req, res) => res.status(503).json({ message: 'Auth not configured in this environment' }));
        authFallback.post('/login', (req, res) => res.status(503).json({ message: 'Auth not configured in this environment' }));
        app.use('/api/auth', authFallback);
    }

    app.get('/', (req, res) => {
        res.send('API del Recetario funcionando!');
    });

    // Endpoint de depuración: insertar receta directamente usando DATABASE_URL
    // Sólo habilitado en entornos de desarrollo o si se proporciona DEBUG_KEY.
    if (process.env.DATABASE_URL) {
        const { Router } = require('express');
        const postgres = require('postgres');
        const debugRouter = Router();

        debugRouter.post('/recetas', async (req, res) => {
            const debugKey = process.env.DEBUG_KEY;
            const headerKey = req.headers['x-debug-key'];
            if (process.env.NODE_ENV === 'production' && !debugKey) {
                return res.status(403).json({ message: 'Debug disabled in production' });
            }
            if (debugKey && headerKey !== debugKey) {
                return res.status(401).json({ message: 'Invalid debug key' });
            }

            const payload = req.body || {};
            if (!payload.name || !payload.userId) return res.status(400).json({ message: 'name and userId are required' });

            const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
            try {
                const result = await sql`
                    INSERT INTO public.recipes (name, description, steps, ingredients, user_id, is_public)
                    VALUES (${payload.name}, ${payload.description || null}, ${JSON.stringify(payload.steps || [])}::jsonb, ${JSON.stringify(payload.ingredients || [])}::jsonb, ${payload.userId}, ${payload.is_public === undefined ? true : payload.is_public})
                    RETURNING *
                `;
                await sql.end();
                return res.status(201).json(result[0]);
            } catch (err) {
                await sql.end();
                return res.status(500).json({ message: err.message });
            }
        });

        app.use('/api/debug', debugRouter);
    }

    // Manejo global de errores: devuelve JSON y mapea el error del cliente Supabase
    app.use((err, req, res, next) => {
        console.error('Unhandled error:', err && err.stack ? err.stack : err);
        const msg = err && err.message ? String(err.message) : 'Internal Server Error';
        if (msg.includes('Supabase client not configured')) {
            return res.status(503).json({ message: 'Supabase client not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in environment or use the app fallback.' });
        }
        res.status(err && err.status ? err.status : 500).json({ message: msg });
    });

    app.listen(config.port, () => {
        const usedBase = config.baseUrl || `http://localhost:${config.port}`;
        console.log(`Servidor escuchando en ${usedBase}`);
        console.log(`Usando Supabase en: ${config.supabaseUrl || 'undefined (set SUPABASE_URL in env)'}`);
    });

    // Endpoint de debugging seguro (no expone keys): devuelve sólo URLs públicas
    app.get('/api/config', (req, res) => {
        return res.json({
            baseUrl: config.baseUrl || `http://localhost:${config.port}`,
            supabaseUrl: config.supabaseUrl || null
        });
    });
}

if (require.main === module) {
    main();
}

module.exports = main;
