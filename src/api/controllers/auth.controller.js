// src/api/controllers/auth.controller.js
const { supabase, supabaseAdmin } = require('../../core/db/supabase');
const postgres = require('postgres');

class AuthController {
    // POST /api/auth/register
    async register(req, res) {
        try {
            const { name, email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'Email y password son requeridos' });

            // 1. Registrar usuario en Supabase Auth con metadata
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name || null // Guardar nombre en user_metadata
                    }
                }
            });

            if (error) {
                console.error('Supabase signUp error:', error);
                return res.status(400).json({ message: error.message, details: error });
            }

            // 2. Si el registro fue exitoso, guardar también en public.users
            if (data.user && data.user.id) {
                try {
                    // Intentar usar supabaseAdmin si está disponible
                    if (supabaseAdmin) {
                        await supabaseAdmin.from('users').insert({
                            id: data.user.id,
                            email: data.user.email,
                            name: name || null,
                            role: 'user',
                            created_at: new Date().toISOString()
                        });
                    } else if (process.env.DATABASE_URL) {
                        // Fallback: conexión directa a BD si no hay admin client
                        const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
                        await sql`
                            INSERT INTO public.users (id, email, name, role, created_at)
                            VALUES (${data.user.id}, ${data.user.email}, ${name || null}, 'user', now())
                            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email
                        `;
                        await sql.end();
                    }
                } catch (dbError) {
                    console.error('Error guardando en public.users:', dbError);
                    // No fallar el registro completo por esto, el usuario ya está en auth.users
                }
            }

            return res.status(201).json({ user: data.user });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }

    // POST /api/auth/login
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'Email y password son requeridos' });

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return res.status(400).json({ message: error.message });

            // data contains session with access_token and refresh_token
            return res.status(200).json({ session: data.session });
        } catch (err) {
            return res.status(500).json({ message: err.message });
        }
    }
}

module.exports = new AuthController();
