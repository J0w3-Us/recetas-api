// tests/2-test-migrations.js
// Verifica que las migraciones se aplicaron correctamente

const postgres = require('postgres');
require('dotenv').config({ path: './src/.env' });

console.log('🔍 Test 2: Estado de las migraciones');

(async function testMigrations() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL no configurada');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

    try {
        console.log('⏳ Verificando tablas creadas por migraciones...');

        // Verificar que existen las tablas principales
        const tables = await sql`
            select table_name 
            from information_schema.tables 
            where table_schema = 'public' 
            and table_name in ('recipes', 'users')
            order by table_name
        `;

        const tableNames = tables.map(t => t.table_name);
        console.log('📋 Tablas encontradas:', tableNames);

        // Verificar estructura de tabla recipes
        if (tableNames.includes('recipes')) {
            console.log('✅ Tabla recipes existe');
            const recipeColumns = await sql`
                select column_name, data_type, is_nullable
                from information_schema.columns 
                where table_schema = 'public' and table_name = 'recipes'
                order by ordinal_position
            `;
            console.log('📝 Columnas de recipes:', recipeColumns.map(c => `${c.column_name}(${c.data_type})`));

            // Contar filas existentes
            const count = await sql`select count(*) as total from public.recipes`;
            console.log('📊 Registros en recipes:', count[0].total);
        } else {
            console.error('❌ Tabla recipes no existe');
        }

        // Verificar estructura de tabla users
        if (tableNames.includes('users')) {
            console.log('✅ Tabla users existe');
            const userColumns = await sql`
                select column_name, data_type, is_nullable
                from information_schema.columns 
                where table_schema = 'public' and table_name = 'users'
                order by ordinal_position
            `;
            console.log('📝 Columnas de users:', userColumns.map(c => `${c.column_name}(${c.data_type})`));

            // Contar filas existentes
            const count = await sql`select count(*) as total from public.users`;
            console.log('📊 Registros en users:', count[0].total);
        } else {
            console.error('❌ Tabla users no existe');
        }

        // Verificar políticas RLS
        const policies = await sql`
            select schemaname, tablename, policyname, cmd, qual 
            from pg_policies 
            where schemaname = 'public' and tablename in ('recipes', 'users')
        `;
        console.log('🔒 Políticas RLS encontradas:', policies.length);
        policies.forEach(p => console.log(`  - ${p.tablename}.${p.policyname} (${p.cmd})`));

        await sql.end();

        if (tableNames.includes('recipes') && tableNames.includes('users')) {
            console.log('🎉 Test 2 PASADO: Migraciones aplicadas correctamente');
        } else {
            console.log('⚠️ Test 2 PARCIAL: Faltan algunas tablas, ejecuta: npm run migrate');
        }

    } catch (err) {
        console.error('❌ Test 2 FALLIDO:', err.message);
        await sql.end();
        process.exit(1);
    }
})();