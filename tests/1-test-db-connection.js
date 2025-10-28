// tests/1-test-db-connection.js
// Prueba la conexión a la BD usando DATABASE_URL

const postgres = require('postgres');
require('dotenv').config({ path: './src/.env' });

console.log('🔍 Test 1: Conexión a la base de datos');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada ✅' : 'No configurada ❌');

(async function testConnection() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL no está configurada en src/.env');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

    try {
        console.log('⏳ Conectando a la base de datos...');

        // Test básico de conexión
        const result = await sql`select now() as current_time, version() as db_version`;
        console.log('✅ Conexión exitosa');
        console.log('🕐 Tiempo actual BD:', result[0].current_time);
        console.log('🗄️ Versión BD:', result[0].db_version.substring(0, 50) + '...');

        // Test específico: verificar que podemos acceder al esquema public
        const schemas = await sql`select schema_name from information_schema.schemata where schema_name in ('public', 'auth')`;
        console.log('📁 Esquemas disponibles:', schemas.map(s => s.schema_name));

        await sql.end();
        console.log('🎉 Test 1 PASADO: Conexión a BD funciona correctamente');

    } catch (err) {
        console.error('❌ Test 1 FALLIDO: Error de conexión:', err.message);
        console.error('🔧 Verifica que DATABASE_URL esté correcta en src/.env');
        await sql.end();
        process.exit(1);
    }
})();
