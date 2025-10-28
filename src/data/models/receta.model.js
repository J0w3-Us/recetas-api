/**
 * @typedef {object} SupabaseRecipeRow
 * @property {number} id
 * @property {string} created_at
 * @property {string} name
 * @property {string | null} description
 * @property {object[]} steps
 * @property {object[]} ingredients
 * @property {string} user_id
 */

/**
 * @typedef {object} CleanRecipeObject
 * @property {number} id
 * @property {string} createdAt
 * @property {string} name
 * @property {string | null} description
 * @property {object[]} steps
 * @property {object[]} ingredients
 * @property {string} userId
 */

/**
 * Mapea una fila cruda de la tabla 'recipes' de Supabase
 * a un objeto de receta limpio y consistente.
 * @param {SupabaseRecipeRow} supabaseRow - La fila de datos directamente de Supabase.
 * @returns {CleanRecipeObject} Un objeto con nombres de propiedad en camelCase.
 */
function fromSupabase(supabaseRow) {
    return {
        id: supabaseRow.id,
        name: supabaseRow.name,
        description: supabaseRow.description,
        steps: supabaseRow.steps,
        ingredients: supabaseRow.ingredients,
        // La magia de la traducción ocurre aquí:
        userId: supabaseRow.user_id,
        createdAt: supabaseRow.created_at,
    };
}

module.exports = {
    fromSupabase,
};
