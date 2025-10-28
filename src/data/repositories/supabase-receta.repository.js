const RecetaRepository = require('../../domain/repositories/receta.repository');
const { supabase, supabaseAdmin } = require('../../core/db/supabase');
const { fromSupabase } = require('../models/receta.model');
const Receta = require('../../domain/entities/receta.entity');

class SupabaseRecetaRepository extends RecetaRepository {
    constructor() {
        super();
    }

    async findById(id) {
        const client = supabase || supabaseAdmin;
        const { data, error } = await client.from('recipes').select('*').eq('id', id).maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return null;

        const clean = fromSupabase(data);
        return new Receta(clean);
    }

    async findAll(opts = {}) {
        try {
            const client = supabase || supabaseAdmin;
            let query = client.from('recipes').select('*').order('created_at', { ascending: false });

            // Apply filters
            if (opts.filters) {
                if (opts.filters.userId) query = query.eq('user_id', opts.filters.userId);
                if (opts.filters.is_public !== undefined) query = query.eq('is_public', opts.filters.is_public);
            }

            // Pagination using range
            if (opts.limit) {
                const from = opts.offset || 0;
                const to = from + opts.limit - 1;
                query = query.range(from, to);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);

            return (data || []).map((row) => new Receta(fromSupabase(row)));
        } catch (err) {
            throw err;
        }
    }

    async findByUser(userId, opts = {}) {
        const mergedOpts = Object.assign({}, opts, { filters: Object.assign({}, opts.filters || {}, { userId }) });
        return this.findAll(mergedOpts);
    }

    async searchByIngredient(ingredientName) {
        // Supabase/Postgres JSONB queries can be tricky depending on shape of ingredients.
        // For simplicity we fetch a window and filter client-side. For production, prefer
        // a proper SQL -> JSONB containment query or an indexed text column.
        const client = supabase || supabaseAdmin;
        const { data, error } = await client.from('recipes').select('*').order('created_at', { ascending: false });
        if (error) throw new Error(error.message);

        const needle = String(ingredientName).toLowerCase();
        const filtered = (data || []).filter((r) => {
            try {
                const ingStr = JSON.stringify(r.ingredients || []).toLowerCase();
                return ingStr.includes(needle);
            } catch (e) {
                return false;
            }
        });

        return filtered.map((row) => new Receta(fromSupabase(row)));
    }

    async create(recetaProps) {
        // Allow passing either entity or plain object
        const payload = recetaProps instanceof Receta ? recetaProps.toJSON() : recetaProps;
        const insert = {
            name: payload.name,
            description: payload.description || null,
            steps: payload.steps || [],
            ingredients: payload.ingredients || [],
            user_id: payload.userId,
            is_public: payload.is_public === undefined ? true : payload.is_public,
        };

        // Use admin client for writes when available (bypass RLS server-side) and enforce user ownership
        const writeClient = supabaseAdmin || supabase;

        // Basic server-side enforcement: ensure user_id is present
        if (!insert.user_id) throw new Error('userId is required to create a receta');

        const { data, error } = await writeClient.from('recipes').insert(insert).select().maybeSingle();
        if (error) throw new Error(error.message);

        return new Receta(fromSupabase(data));
    }

    async update(id, updateProps) {
        const update = {};
        if (updateProps.name !== undefined) update.name = updateProps.name;
        if (updateProps.description !== undefined) update.description = updateProps.description;
        if (updateProps.steps !== undefined) update.steps = updateProps.steps;
        if (updateProps.ingredients !== undefined) update.ingredients = updateProps.ingredients;
        if (updateProps.is_public !== undefined) update.is_public = updateProps.is_public;

        const writeClient = supabaseAdmin || supabase;
        const { data, error } = await writeClient.from('recipes').update(update).eq('id', id).select().maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return null;

        return new Receta(fromSupabase(data));
    }

    async delete(id) {
        const writeClient = supabaseAdmin || supabase;
        const { data, error } = await writeClient.from('recipes').delete().eq('id', id).select().maybeSingle();
        if (error) throw new Error(error.message);
        return !!data;
    }
}

module.exports = SupabaseRecetaRepository;
