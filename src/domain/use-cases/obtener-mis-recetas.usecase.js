// src/domain/use-cases/obtener-mis-recetas.usecase.js
class ObtenerMisRecetasUseCase {
    constructor(recetaRepository) {
        this.recetaRepository = recetaRepository;
    }

    async execute(userId) {
        if (!userId) {
            throw new Error('userId es requerido');
        }

        // Usa el método findByUser del repositorio que filtra por user_id
        const recetas = await this.recetaRepository.findByUser(userId);
        return recetas;
    }
}

module.exports = ObtenerMisRecetasUseCase;
