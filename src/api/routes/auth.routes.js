// src/api/routes/auth.routes.js
const { Router } = require('express');
const authController = require('../controllers/auth.controller');

function createAuthRouter() {
    const router = Router();

    router.post('/register', authController.register.bind(authController));
    router.post('/login', authController.login.bind(authController));

    return router;
}

module.exports = createAuthRouter;
