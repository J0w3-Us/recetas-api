/**
 * Contrato / Interfaz para el repositorio de Recetas.
 *
 * Este archivo define los métodos esperados por los casos de uso (use-cases).
 * Implementaciones concretas (por ejemplo con Supabase) deben seguir este contrato.
 *
 * Nota: En JavaScript no existen interfaces formales; aquí usamos una clase
 * abstracta con métodos que lanzan si no fueron implementados.
 */

/**
 * @typedef {import('../entities/receta.entity.js')} Receta
 */

class RecetaRepository {
    constructor() {
        if (this.constructor === RecetaRepository) {
            throw new Error('RecetaRepository es una interfaz abstracta y no puede instanciarse directamente.');
        }
    }

    /**
     * Busca una receta por su id.
     * @param {number} id
     * @returns {Promise<Receta|null>}
     */
    async findById(id) {
        throw new Error('findById no implementado');
    }

    /**
     * Lista recetas con soporte de paginación y filtros opcionales.
     * @param {object} [opts]
     * @param {number} [opts.limit]
     * @param {number} [opts.offset]
     * @param {object} [opts.filters]
     * @returns {Promise<Receta[]>}
     */
    async findAll(opts = {}) {
        throw new Error('findAll no implementado');
    }

    /**
     * Lista recetas de un usuario concreto.
     * @param {string} userId
     * @param {object} [opts]
     * @returns {Promise<Receta[]>}
     */
    async findByUser(userId, opts = {}) {
        throw new Error('findByUser no implementado');
    }

    /**
     * Busca recetas que contengan un ingrediente (búsqueda simple).
     * @param {string} ingredientName
     * @returns {Promise<Receta[]>}
     */
    async searchByIngredient(ingredientName) {
        throw new Error('searchByIngredient no implementado');
    }

    /**
     * Crea una nueva receta.
     * @param {object} recetaProps - Propiedades para construir la entidad Receta o datos planos.
     * @returns {Promise<Receta>} - La receta creada (con id y timestamps si aplica).
     */
    async create(recetaProps) {
        throw new Error('create no implementado');
    }

    /**
     * Actualiza una receta existente.
     * @param {number} id
     * @param {object} updateProps
     * @returns {Promise<Receta>} - La receta actualizada.
     */
    async update(id, updateProps) {
        throw new Error('update no implementado');
    }

    /**
     * Elimina una receta por id.
     * @param {number} id
     * @returns {Promise<boolean>} - true si se eliminó, false si no existía.
     */
    async delete(id) {
        throw new Error('delete no implementado');
    }
}

module.exports = RecetaRepository;
