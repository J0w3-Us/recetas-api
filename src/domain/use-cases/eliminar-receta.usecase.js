// src/domain/use-cases/eliminar-receta.usecase.js
class EliminarRecetaUseCase {
    constructor(recetaRepository) {
        this.recetaRepository = recetaRepository;
    }

    // Podríamos añadir lógica aquí para verificar permisos si no confiáramos en RLS
    async execute(id) {
        return this.recetaRepository.delete(id);
    }
}

module.exports = EliminarRecetaUseCase;
