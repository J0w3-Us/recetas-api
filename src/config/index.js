const path = require('path');
// Cargar .env que está en `src/.env` (si existe). Esto garantiza que al ejecutar
// `node src/app.js` las variables definidas en `src/.env` sean cargadas.
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const port = process.env.PORT || 3000;

const config = {
    // Base port
    port,
    // Base URL exposed for clients / logging
    baseUrl: process.env.BASE_URL || `http://localhost:${port}`,
    jwtSecret: process.env.JWT_SECRET || process.env.JWTSECRET || 'dev-secret',
    // Default supabase URL (falls back to the project's Supabase URL provided)
    supabaseUrl: process.env.SUPABASE_URL || 'https://ftideccixaxoxneyqbuf.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
};

module.exports = config;
