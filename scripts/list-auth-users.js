const postgres = require('postgres');
require('dotenv').config({ path: './src/.env' });

(async function () {
    const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
    try {
        const users = await sql`select id, email from auth.users limit 10`;
        console.log('auth.users:', users);
    } catch (err) {
        console.error('Error querying auth.users:', err.message);
    } finally {
        await sql.end();
    }
})();
