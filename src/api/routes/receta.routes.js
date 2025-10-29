// src/api/routes/receta.routes.js
const { Router } = require('express');
// --- INICIO DE CAMBIOS ---
// Importa las herramientas de validación de la nueva librería.
const { body, param } = require('express-validator');
// --- FIN DE CAMBIOS ---
const authMiddleware = require('../middlewares/auth.middleware');

// La función recibe el controlador ya instanciado
function createRecetaRouter(recetaController) {
    const router = Router();

    // --- INICIO DE CAMBIOS ---
    // Añadimos validaciones para la ruta POST /
    router.post(
        '/',
        authMiddleware,
        [
            body('name')
                .trim()
                .notEmpty().withMessage('El título (name) es obligatorio.')
                .isLength({ min: 3 }).withMessage('El título (name) debe tener al menos 3 caracteres.'),

            body('description')
                .trim()
                .notEmpty().withMessage('La descripción (description) es obligatoria.'),

            body('steps')
                .isArray({ min: 1 }).withMessage('La receta debe tener al menos un paso (steps).'),

            body('ingredients')
                .isArray({ min: 1 }).withMessage('La receta debe tener al menos un ingrediente.')
        ],
        recetaController.create
    );
    // --- FIN DE CAMBIOS ---

    router.get('/', authMiddleware, recetaController.getAll);
    router.get('/mis-recetas', authMiddleware, recetaController.getMyRecipes);
    router.get('/:id', authMiddleware, recetaController.getById);

    // PUT /:id - Actualizar receta con validación
    router.put(
        '/:id',
        authMiddleware,
        [
            param('id').isNumeric().withMessage('El ID debe ser un número válido.'),
            body('name')
                .optional()
                .trim()
                .isLength({ min: 3 }).withMessage('El título (name) debe tener al menos 3 caracteres.'),
            body('description')
                .optional()
                .trim()
                .notEmpty().withMessage('La descripción no puede estar vacía.'),
            body('steps')
                .optional()
                .isArray({ min: 1 }).withMessage('La receta debe tener al menos un paso (steps).'),
            body('ingredients')
                .optional()
                .isArray({ min: 1 }).withMessage('La receta debe tener al menos un ingrediente.')
        ],
        recetaController.updateById
    );

    // DELETE /:id - Eliminar receta con validación
    router.delete(
        '/:id',
        authMiddleware,
        [
            param('id').isNumeric().withMessage('El ID debe ser un número válido.')
        ],
        recetaController.deleteById
    );

    return router;
}

// Exportar la función y también las validaciones para poder reutilizarlas en tests
createRecetaRouter.recetaValidation = [
    // Reutilizamos las mismas reglas definidas arriba
    // Esto hace más fácil montar una ruta de test que omita authMiddleware.
    require('express-validator').body('name').trim().notEmpty().withMessage('El título (name) es obligatorio.').isLength({ min: 3 }).withMessage('El título (name) debe tener al menos 3 caracteres.'),
    require('express-validator').body('description').trim().notEmpty().withMessage('La descripción (description) es obligatoria.'),
    require('express-validator').body('steps').isArray({ min: 1 }).withMessage('La receta debe tener al menos un paso (steps).'),
    require('express-validator').body('ingredients').isArray({ min: 1 }).withMessage('La receta debe tener al menos un ingrediente.')
];

module.exports = createRecetaRouter;
