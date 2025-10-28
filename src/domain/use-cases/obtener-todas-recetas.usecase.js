// src/domain/use-cases/obtener-todas-recetas.usecase.js
class ObtenerTodasRecetasUseCase {
    constructor(recetaRepository) {
        this.recetaRepository = recetaRepository;
    }

    async execute() {
        return this.recetaRepository.findAll();
    }
}

module.exports = ObtenerTodasRecetasUseCase;
