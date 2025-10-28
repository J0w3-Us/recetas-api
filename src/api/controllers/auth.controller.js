// src/api/controllers/auth.controller.js
const { supabase } = require('../../core/db/supabase');

class AuthController {
    // POST /api/auth/register
    async register(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'Email y password son requeridos' });

            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                // Log the full error server-side to help debugging (no secrets are returned here)
                console.error('Supabase signUp error:', error);
                // Return the message from Supabase to the client for clarity
                return res.status(400).json({ message: error.message, details: error });
            }

            // data.user may be present; depending on Supabase settings confirmation may be required
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
