require('dotenv').config({ path: './src/.env' });
const postgres = require('postgres');

console.log('👤 Creando usuario de prueba en public.users');

(async () => {
    const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

    try {
        const result = await sql`
      INSERT INTO public.users (id, email, password_hash, name, role, created_at) 
      VALUES ('550e8400-e29b-41d4-a716-446655440000', 'testuser@ejemplo.com', '$2a$10$hash_ejemplo', 'Usuario de Prueba', 'user', now()) 
      ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email 
      RETURNING id, email, name, role, created_at
    `;
        console.log('✅ Usuario creado/actualizado:', result[0]);

        const allUsers = await sql`SELECT id, email, name, role FROM public.users ORDER BY created_at DESC`;
        console.log('📋 Todos los usuarios en BD:');
        allUsers.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.id}]`));

        await sql.end();
        console.log('🎉 Listo! Puedes usar este usuario para crear recetas');

    } catch (err) {
        console.error('❌ Error:', err.message);
        await sql.end();
    }
})();