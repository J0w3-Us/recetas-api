// src/core/db/postgres.js
// Cliente Postgres usando la librería `postgres`.
// Lee la connection string desde `process.env.DATABASE_URL` (cargada desde src/.env).
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('Missing DATABASE_URL in environment (add it to src/.env as DATABASE_URL="postgresql://user:pass@host:5432/dbname").');
}

const sql = postgres(connectionString, {
    // Opciones por defecto. Ajusta SSL si tu host lo requiere.
    ssl: { rejectUnauthorized: false }
});

module.exports = sql;
