// src/domain/use-cases/obtener-receta-por-id.usecase.js
class ObtenerRecetaPorIdUseCase {
    constructor(recetaRepository) {
        this.recetaRepository = recetaRepository;
    }

    async execute(id) {
        if (!id || isNaN(id)) {
            throw new Error('ID de receta inválido');
        }

        const receta = await this.recetaRepository.findById(id);
        return receta;
    }
}

module.exports = ObtenerRecetaPorIdUseCase;
