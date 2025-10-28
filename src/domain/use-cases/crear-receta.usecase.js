// src/domain/use-cases/crear-receta.usecase.js
const Receta = require('../entities/receta.entity');

class CrearRecetaUseCase {
    constructor(recetaRepository) {
        this.recetaRepository = recetaRepository;
    }

    async execute(recetaData) {
        // 1. Validar y crear la entidad de dominio
        const nuevaReceta = new Receta(recetaData);

        // 2. Persistir la entidad usando el repositorio
        return this.recetaRepository.create(nuevaReceta);
    }
}

module.exports = CrearRecetaUseCase;
