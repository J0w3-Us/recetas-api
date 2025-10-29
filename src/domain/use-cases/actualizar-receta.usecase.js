// src/domain/use-cases/actualizar-receta.usecase.js
const Receta = require('../entities/receta.entity');

class ActualizarRecetaUseCase {
    constructor(recetaRepository) {
        this.recetaRepository = recetaRepository;
    }

    async execute(id, updateData, userId) {
        // 1. Verificar que la receta existe
        const recetaExistente = await this.recetaRepository.findById(id);
        if (!recetaExistente) {
            throw new Error('Receta no encontrada');
        }

        // 2. Verificar que el usuario es el propietario de la receta
        if (recetaExistente.userId !== userId) {
            throw new Error('No tienes permisos para actualizar esta receta');
        }

        // 3. Validar los nuevos datos usando la entidad
        // Creamos una nueva entidad con los datos actualizados para validar
        const datosActualizados = {
            id: recetaExistente.id,
            name: updateData.name !== undefined ? updateData.name : recetaExistente.name,
            description: updateData.description !== undefined ? updateData.description : recetaExistente.description,
            steps: updateData.steps !== undefined ? updateData.steps : recetaExistente.steps,
            ingredients: updateData.ingredients !== undefined ? updateData.ingredients : recetaExistente.ingredients,
            userId: recetaExistente.userId,
            createdAt: recetaExistente.createdAt
        };

        // Validamos los datos actualizados creando una nueva entidad
        new Receta(datosActualizados);

        // 4. Actualizar en el repositorio
        return this.recetaRepository.update(id, updateData);
    }
}

module.exports = ActualizarRecetaUseCase;