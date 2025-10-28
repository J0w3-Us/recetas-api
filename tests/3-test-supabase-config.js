// tests/3-test-supabase-config.js
// Verifica la configuración de Supabase y qué repositorio está usando la app

require('dotenv').config({ path: '../src/.env' });

console.log('🔍 Test 3: Configuración de Supabase');

function testSupabaseConfig() {
    console.log('⏳ Verificando variables de entorno...');

    // Verificar variables de entorno
    const envVars = {
        'DATABASE_URL': !!process.env.DATABASE_URL,
        'SUPABASE_URL': !!process.env.SUPABASE_URL,
        'SUPABASE_ANON_KEY': !!process.env.SUPABASE_ANON_KEY,
        'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    console.log('🔧 Variables de entorno:');
    Object.entries(envVars).forEach(([key, exists]) => {
        console.log(`  ${key}: ${exists ? '✅ Configurada' : '❌ No configurada'}`);
    });

    // Verificar configuración del módulo config
    try {
        const config = require('../src/config');
        console.log('📋 Configuración cargada:');
        console.log(`  port: ${config.port}`);
        console.log(`  baseUrl: ${config.baseUrl || 'undefined'}`);
        console.log(`  supabaseUrl: ${config.supabaseUrl || 'undefined'}`);
        console.log(`  supabaseAnonKey: ${config.supabaseAnonKey ? '✅ Presente' : '❌ Ausente'}`);

        // Determinar qué repositorio usará la app
        const willUseSupabase = config.supabaseUrl && config.supabaseAnonKey;
        console.log('🗄️ Repositorio que usará la app:', willUseSupabase ? '✅ SupabaseRecetaRepository' : '⚠️ MemoryRecetaRepository (fallback)');

        if (!willUseSupabase) {
            console.log('⚠️ ADVERTENCIA: La app usará repositorio en memoria (no persistirá en BD)');
            console.log('🔧 Solución: Configura SUPABASE_URL y SUPABASE_ANON_KEY en src/.env');
        }

    } catch (err) {
        console.error('❌ Error cargando configuración:', err.message);
    }

    // Test de cliente Supabase
    if (envVars.SUPABASE_URL && envVars.SUPABASE_ANON_KEY) {
        try {
            console.log('⏳ Probando inicialización del cliente Supabase...');
            const { supabase } = require('../src/core/db/supabase');

            if (supabase && supabase.auth) {
                console.log('✅ Cliente Supabase inicializado correctamente');
                console.log(`  URL: ${supabase.supabaseUrl}`);
                console.log(`  Key: ${supabase.supabaseKey ? supabase.supabaseKey.substring(0, 20) + '...' : 'No disponible'}`);
            } else {
                console.log('⚠️ Cliente Supabase no inicializado correctamente');
            }

        } catch (err) {
            console.error('❌ Error inicializando cliente Supabase:', err.message);
        }
    }
}

testSupabaseConfig();

console.log('🎉 Test 3 completado - Revisa los resultados arriba');