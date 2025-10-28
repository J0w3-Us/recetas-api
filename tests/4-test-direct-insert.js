// tests/4-test-direct-insert.js
// Prueba inserción directa en BD usando DATABASE_URL (bypasa Supabase RLS)

const postgres = require('postgres');
require('dotenv').config({ path: './src/.env' });

console.log('🔍 Test 4: Inserción directa en la base de datos');

(async function testDirectInsert() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL no configurada');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

    try {
        console.log('⏳ Preparando inserción de prueba...');

        // Verificar que existe un usuario en auth.users para usar como FK
        const authUsers = await sql`select id, email from auth.users limit 1`;
        if (authUsers.length === 0) {
            console.log('⚠️ No hay usuarios en auth.users, creando uno ficticio en public.users...');
            // Si no hay usuarios auth, insertar uno en public.users para pruebas
            const testUser = await sql`
                INSERT INTO public.users (id, email, name, role, created_at) 
                VALUES ('test-user-123', 'test@example.com', 'Test User', 'user', now())
                ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
                RETURNING id, email
            `;
            console.log('👤 Usuario de prueba creado:', testUser[0]);
            var userId = testUser[0].id;
        } else {
            console.log('👤 Usuario encontrado en auth.users:', authUsers[0]);
            var userId = authUsers[0].id;
        }

        // Limpiar recetas de prueba anteriores
        await sql`DELETE FROM public.recipes WHERE name LIKE 'Test Recipe %'`;

        // Insertar receta de prueba
        const testRecipe = {
            name: `Test Recipe ${Date.now()}`,
            description: 'Receta insertada directamente en BD para diagnóstico',
            steps: JSON.stringify(['Paso 1: Test', 'Paso 2: Verificar']),
            ingredients: JSON.stringify(['ingrediente1', 'ingrediente2']),
            user_id: userId,
            is_public: true
        };

        console.log('⏳ Insertando receta de prueba...');
        const insertedRecipe = await sql`
            INSERT INTO public.recipes (name, description, steps, ingredients, user_id, is_public, created_at)
            VALUES (${testRecipe.name}, ${testRecipe.description}, ${testRecipe.steps}::jsonb, ${testRecipe.ingredients}::jsonb, ${testRecipe.user_id}, ${testRecipe.is_public}, now())
            RETURNING id, name, description, user_id, created_at
        `;

        console.log('✅ Receta insertada:', insertedRecipe[0]);

        // Verificar que la receta se puede leer
        const readRecipe = await sql`
            SELECT id, name, description, steps, ingredients, user_id, is_public, created_at 
            FROM public.recipes 
            WHERE id = ${insertedRecipe[0].id}
        `;

        console.log('✅ Receta leída desde BD:', {
            id: readRecipe[0].id,
            name: readRecipe[0].name,
            user_id: readRecipe[0].user_id,
            created_at: readRecipe[0].created_at
        });

        // Contar total de recetas
        const totalCount = await sql`SELECT count(*) as total FROM public.recipes`;
        console.log(`📊 Total de recetas en BD: ${totalCount[0].total}`);

        await sql.end();
        console.log('🎉 Test 4 PASADO: Inserción directa funciona correctamente');
        console.log('💡 Esto confirma que la BD acepta inserts cuando se bypasa RLS');

    } catch (err) {
        console.error('❌ Test 4 FALLIDO:', err.message);
        if (err.message.includes('violates foreign key constraint')) {
            console.log('🔧 Solución: El user_id no existe en la tabla referenciada');
        }
        await sql.end();
        process.exit(1);
    }
})();