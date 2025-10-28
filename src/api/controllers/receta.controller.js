// src/api/controllers/receta.controller.js
class RecetaController {
    // Estas propiedades se inyectarán en app.js
    constructor(crearRecetaUseCase, obtenerTodasRecetasUseCase, eliminarRecetaUseCase) {
        this.crearRecetaUseCase = crearRecetaUseCase;
        this.obtenerTodasRecetasUseCase = obtenerTodasRecetasUseCase;
        this.eliminarRecetaUseCase = eliminarRecetaUseCase;

        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.deleteById = this.deleteById.bind(this);
    }

    async create(req, res) {
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

    async deleteById(req, res) {
        try {
            const { id } = req.params;
            await this.eliminarRecetaUseCase.execute(Number(id));
            res.status(204).send(); // 204 No Content
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = RecetaController;
