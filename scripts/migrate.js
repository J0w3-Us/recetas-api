#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const postgres = require('postgres');

// Cargar .env de src si existe
dotenv.config({ path: path.resolve(__dirname, '../src/.env') });

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');

async function run() {
    const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
    if (!databaseUrl) {
        console.error('FATAL: No se encontró DATABASE_URL en el entorno. Añade DATABASE_URL a src/.env o a las variables de entorno.');
        process.exit(1);
    }

    console.log('Conectando a la base de datos...');
    const sql = postgres(databaseUrl, { ssl: { rejectUnauthorized: false } });

    // Leer archivos de migración
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.sql'))
        .sort();

    if (files.length === 0) {
        console.log('No hay archivos de migración en', MIGRATIONS_DIR);
        await sql.end({ timeout: 2 });
        return;
    }

    console.log(`Aplicando ${files.length} migraciones (idempotentes)...`);

    for (const file of files) {
        const filePath = path.join(MIGRATIONS_DIR, file);
        console.log(`Ejecutando: ${file}`);
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        try {
            // Ejecutar SQL crudo. usamos unsafe porque el contenido puede incluir múltiples statements.
            await sql.unsafe(sqlContent);
            console.log(`OK: ${file}`);
        } catch (err) {
            console.error(`Error ejecutando ${file}:`, err.message || err);
            console.error('Abortando. Revisa la base de datos y corrige el problema antes de reintentar.');
            await sql.end({ timeout: 2 });
            process.exit(1);
        }
    }

    console.log('Migraciones ejecutadas (intentadas) correctamente.');
    await sql.end({ timeout: 2 });
}

run().catch(err => {
    console.error('Error durante migración:', err);
    process.exit(1);
});
