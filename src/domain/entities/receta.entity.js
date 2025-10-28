/**
 * Representa una Receta dentro del dominio de la aplicación.
 * Contiene la lógica y las reglas de negocio inherentes a una receta.
 */
class Receta {
    /**
     * Crea una instancia de Receta.
     * @param {object} props - Las propiedades de la receta.
     * @param {number} [props.id] - El ID de la receta (solo existe si ya está en la BD).
     * @param {string} props.name - El nombre de la receta.
     * @param {string | null} props.description - La descripción de la receta.
     * @param {object[]} props.steps - Los pasos para la preparación.
     * @param {object[]} props.ingredients - Los ingredientes necesarios.
     * @param {string} props.userId - El ID del usuario creador.
     * @param {string} [props.createdAt] - La fecha de creación.
     */
    constructor({ id, name, description, steps, ingredients, userId, createdAt }) {
        // --- Lógica de Validación ---
        // Una receta debe tener siempre un nombre.
        if (!name || typeof name !== 'string' || name.trim() === '') {
            throw new Error('El nombre de la receta es obligatorio.');
        }

        // Una receta debe pertenecer siempre a un usuario.
        if (!userId) {
            throw new Error('La receta debe estar asociada a un usuario (userId es obligatorio).');
        }

        // --- Asignación de Propiedades ---
        this.id = id;
        this.name = name;
        this.description = description;
        this.steps = Array.isArray(steps) ? steps : [];
        this.ingredients = Array.isArray(ingredients) ? ingredients : [];
        this.userId = userId;
        this.createdAt = createdAt;
    }

    /**
     * Devuelve una representación plana (POJO) de la entidad.
     * Útil para serializar o enviar a capas externas.
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            steps: this.steps,
            ingredients: this.ingredients,
            userId: this.userId,
            createdAt: this.createdAt,
        };
    }
}

module.exports = Receta;
