// src/api/routes/receta.routes.js
const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');

// La función recibe el controlador ya instanciado
function createRecetaRouter(recetaController) {
    const router = Router();

    router.post('/', authMiddleware, recetaController.create);
    router.get('/', authMiddleware, recetaController.getAll);
    router.delete('/:id', authMiddleware, recetaController.deleteById);

    return router;
}

module.exports = createRecetaRouter;
