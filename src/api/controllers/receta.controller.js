// src/api/controllers/receta.controller.js
// --- INICIO DE CAMBIOS ---
// Importa la función que nos da el resultado de la validación.
const { validationResult } = require('express-validator');
// --- FIN DE CAMBIOS ---
class RecetaController {
    // Estas propiedades se inyectarán en app.js
    constructor(crearRecetaUseCase, obtenerTodasRecetasUseCase, eliminarRecetaUseCase, obtenerRecetaPorIdUseCase, obtenerMisRecetasUseCase, actualizarRecetaUseCase) {
        this.crearRecetaUseCase = crearRecetaUseCase;
        this.obtenerTodasRecetasUseCase = obtenerTodasRecetasUseCase;
        this.eliminarRecetaUseCase = eliminarRecetaUseCase;
        this.obtenerRecetaPorIdUseCase = obtenerRecetaPorIdUseCase;
        this.obtenerMisRecetasUseCase = obtenerMisRecetasUseCase;
        this.actualizarRecetaUseCase = actualizarRecetaUseCase;

        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.getMyRecipes = this.getMyRecipes.bind(this);
        this.updateById = this.updateById.bind(this);
        this.deleteById = this.deleteById.bind(this);
    }

    async create(req, res) {
        // --- INICIO DE CAMBIOS ---
        // Comprueba si hubo errores de validación en la petición.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Si hay errores, la API responde inmediatamente con 400 y lista de errores.
            return res.status(400).json({ errors: errors.array() });
        }
        // --- FIN DE CAMBIOS ---

        try {
            const recetaData = {
                ...req.body,
                userId: req.user.id // El ID del usuario viene del middleware
            };
            const nuevaReceta = await this.crearRecetaUseCase.execute(recetaData);
            res.status(201).json(nuevaReceta);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getAll(req, res) {
        try {
            const recetas = await this.obtenerTodasRecetasUseCase.execute();
            res.status(200).json(recetas);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const receta = await this.obtenerRecetaPorIdUseCase.execute(Number(id));

            if (!receta) {
                return res.status(404).json({ message: 'Receta no encontrada' });
            }

            res.status(200).json(receta);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getMyRecipes(req, res) {
        try {
            const userId = req.user.id; // El ID viene del token validado por authMiddleware
            const recetas = await this.obtenerMisRecetasUseCase.execute(userId);
            res.status(200).json(recetas);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async updateById(req, res) {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Solo actualizar campos que fueron enviados
            const updateData = {};
            if (req.body.name !== undefined) updateData.name = req.body.name;
            if (req.body.description !== undefined) updateData.description = req.body.description;
            if (req.body.steps !== undefined) updateData.steps = req.body.steps;
            if (req.body.ingredients !== undefined) updateData.ingredients = req.body.ingredients;
            if (req.body.is_public !== undefined) updateData.is_public = req.body.is_public;
            if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;

            const recetaActualizada = await this.actualizarRecetaUseCase.execute(Number(id), updateData, userId);

            if (!recetaActualizada) {
                return res.status(404).json({ message: 'Receta no encontrada' });
            }

            res.status(200).json(recetaActualizada);
        } catch (error) {
            if (error.message.includes('no encontrada')) {
                return res.status(404).json({ message: error.message });
            }
            if (error.message.includes('permisos')) {
                return res.status(403).json({ message: error.message });
            }
            res.status(400).json({ message: error.message });
        }
    }

    async deleteById(req, res) {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Verificar que la receta existe y el usuario es propietario
            const receta = await this.obtenerRecetaPorIdUseCase.execute(Number(id));
            if (!receta) {
                return res.status(404).json({ message: 'Receta no encontrada' });
            }

            if (receta.userId !== userId) {
                return res.status(403).json({ message: 'No tienes permisos para eliminar esta receta' });
            }

            await this.eliminarRecetaUseCase.execute(Number(id));
            res.status(204).send(); // 204 No Content
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = RecetaController;
