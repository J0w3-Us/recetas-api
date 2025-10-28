// src/api/middlewares/auth.middleware.js
const { supabase } = require('../../core/db/supabase');

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data || !data.user) {
            return res.status(401).json({ message: 'Token inválido.' });
        }
        req.user = { id: data.user.id };
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token inválido.' });
    }
}

module.exports = authMiddleware;
