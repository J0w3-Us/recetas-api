const { createClient } = require('@supabase/supabase-js');
// Importar la configuración para asegurar que dotenv se carga desde `src/.env`.
const config = require('../../config');

const SUPABASE_URL = config.supabaseUrl || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = config.supabaseAnonKey || process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Exportaremos { supabase, supabaseAdmin }
let supabase = null;
let supabaseAdmin = null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Warning: SUPABASE_URL or SUPABASE_ANON_KEY not set — supabase client not initialized');
} else {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    // Cliente server-side con service_role (omite RLS). Úsalo con precaución.
    supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        // Desactivar persistencia de sesión en servidor
        auth: { persistSession: false }
    });
} else if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not set - server-side admin client not available');
}

module.exports = { supabase, supabaseAdmin };
