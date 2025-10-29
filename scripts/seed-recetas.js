const postgres = require('postgres');
require('dotenv').config({ path: './src/.env' });

(async function seedRecetas() {
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL no configurada en src/.env. No puedo insertar datos.');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

    try {
        console.log('🔍 Buscando un userId válido en auth.users...');
        const authUsers = await sql`select id, email from auth.users limit 1`;
        let userId = null;

        if (authUsers.length > 0) {
            userId = authUsers[0].id;
            console.log('👤 Usando user de auth.users:', authUsers[0]);
        } else {
            console.log('⚠️ No hay usuarios en auth.users. Buscando en public.users...');
            const pubUsers = await sql`select id, email from public.users limit 1`;
            if (pubUsers.length > 0) {
                userId = pubUsers[0].id;
                console.log('👤 Usando user de public.users:', pubUsers[0]);
            }
        }

        if (!userId) {
            console.error('❌ No se encontró ningún usuario en auth.users ni en public.users.');
            console.error('   Crea un usuario (registro) o añade manualmente uno en la BD antes de seedear.');
            await sql.end();
            process.exit(1);
        }

        // Recipes shaped like front requests (arrays de strings para steps/ingredients)
        const recetas = [
            {
                name: 'Tarta de manzana',
                description: 'Clásica tarta de manzana, perfecta para merendar.',
                steps: ['Pelar y cortar manzanas', 'Mezclar masa', 'Colocar manzanas', 'Hornear 45 minutos'],
                ingredients: ['manzana', 'harina', 'azúcar', 'mantequilla', 'huevo'],
                is_public: true
            },
            {
                name: 'Gazpacho Andaluz',
                description: 'Sopa fría tradicional, refrescante en verano.',
                steps: ['Triturar tomates y verduras', 'Colar', 'Servir frío con aceite de oliva'],
                ingredients: ['tomate', 'pepino', 'pimiento', 'ajo', 'aceite de oliva', 'vinagre', 'sal'],
                is_public: true
            },
            {
                name: 'Ensalada César',
                description: 'Ensalada con aderezo cremoso y croutons.',
                steps: ['Preparar aderezo', 'Cortar lechuga', 'Mezclar y añadir croutons'],
                ingredients: ['lechuga romana', 'parmesano', 'pan', 'anchoas', 'huevo', 'aceite'],
                is_public: true
            },
            {
                name: 'Arroz con leche',
                description: 'Postre cremoso y dulce.',
                steps: ['Hervir leche con arroz', 'Añadir azúcar', 'Cocinar hasta espesar'],
                ingredients: ['arroz', 'leche', 'azúcar', 'canela'],
                is_public: true
            },
            {
                name: 'Huevos revueltos',
                description: 'Rápido y sencillo para el desayuno.',
                steps: ['Batir huevos', 'Cocinar en sartén con mantequilla', 'Servir calientes'],
                ingredients: ['huevo', 'mantequilla', 'sal', 'pimienta'],
                is_public: true
            }
        ];

        // Limpiar recetas con mismo nombre (evitar duplicados si ejecutas varias veces)
        const names = recetas.map((r) => r.name);
        console.log('🧹 Limpiando recetas existentes con los mismos nombres (si las hay)...');
        await sql`DELETE FROM public.recipes WHERE name = ANY(${names})`;

        console.log(`✳️ Insertando ${recetas.length} recetas...`);
        const inserted = [];
        for (const r of recetas) {
            const insertedRow = await sql`
                INSERT INTO public.recipes (name, description, steps, ingredients, user_id, is_public, created_at)
                VALUES (
                    ${r.name},
                    ${r.description},
                    ${JSON.stringify(r.steps)}::jsonb,
                    ${JSON.stringify(r.ingredients)}::jsonb,
                    ${userId},
                    ${r.is_public},
                    now()
                )
                RETURNING id, name, user_id, created_at
            `;
            inserted.push(insertedRow[0]);
            console.log('✅ Insertada:', insertedRow[0]);
        }

        const totalCount = await sql`SELECT count(*) as total FROM public.recipes`;
        console.log(`📊 Total de recetas en BD después del seed: ${totalCount[0].total}`);

        await sql.end();
        console.log('🎉 Seed completado correctamente.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error durante el seed:', err.message);
        await sql.end();
        process.exit(1);
    }
})();
