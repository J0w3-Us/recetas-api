// scripts/create-test-user.js
// Crea un usuario de prueba directamente en public.users

const postgres = require('postgres');
const crypto = require('crypto');
require('dotenv').config({ path: './src/.env' });

console.log('👤 Creando usuario de prueba en public.users');

(async function createTestUser() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL no configurada');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

    try {
        // Generar UUID simple para el usuario
        const userId = crypto.randomUUID();
        const email = 'test@ejemplo.com';
        const password = 'password123';
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        console.log('⏳ Insertando usuario en public.users...');

        // Insertar usuario en public.users
        const newUser = await sql`
            INSERT INTO public.users (id, email, password_hash, name, role, created_at)
            VALUES (${userId}, ${email}, ${passwordHash}, 'Usuario Test', 'user', now())
            ON CONFLICT (email) DO UPDATE SET 
                password_hash = EXCLUDED.password_hash,
                name = EXCLUDED.name,
                updated_at = now()
            RETURNING id, email, name, role, created_at
        `;

        console.log('✅ Usuario creado/actualizado:', newUser[0]);
        console.log('🔑 Credenciales para usar:');
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   ID: ${userId}`);

        // Verificar que se puede usar este usuario para crear recetas
        console.log('⏳ Creando receta de prueba con este usuario...');

        const testRecipe = await sql`
            INSERT INTO public.recipes (name, description, steps, ingredients, user_id, is_public, created_at)
            VALUES ('Receta del usuario test', 'Creada con el usuario insertado en public.users', 
                   '["Paso 1", "Paso 2"]'::jsonb, '["ingrediente1", "ingrediente2"]'::jsonb, 
                   ${userId}, true, now())
            RETURNING id, name, user_id
        `;

        console.log('✅ Receta de prueba creada:', testRecipe[0]);

        await sql.end();
        console.log('🎉 Usuario y receta de prueba listos para usar');

    } catch (err) {
        console.error('❌ Error:', err.message);
        await sql.end();
        process.exit(1);
    }
})();