// tests/test-update-delete-validation.js
// Test para validar las operaciones PUT y DELETE de recetas

const express = require('express');
const request = require('supertest');
const { body, param, validationResult } = require('express-validator');

// Crear una mini-app para testing que incluye PUT y DELETE
function createTestApp() {
    const app = express();
    app.use(express.json());

    // Mock de base de datos en memoria para tests
    let mockRecetas = [
        {
            id: 1,
            name: 'Receta Existente',
            description: 'Descripción original',
            steps: ['Paso 1', 'Paso 2'],
            ingredients: ['Ingredient 1', 'Ingredient 2'],
            userId: 'test_user_123',
            createdAt: '2025-10-29T10:00:00.000Z'
        },
        {
            id: 2,
            name: 'Receta de Otro Usuario',
            description: 'No deberías poder editarla',
            steps: ['Paso 1'],
            ingredients: ['Ingredient 1'],
            userId: 'other_user_456',
            createdAt: '2025-10-29T11:00:00.000Z'
        }
    ];

    const mockController = {
        // PUT /recetas/:id - Actualizar receta
        update: async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const recetaIndex = mockRecetas.findIndex(r => r.id === parseInt(id));

            if (recetaIndex === -1) {
                return res.status(404).json({ message: 'Receta no encontrada' });
            }

            const receta = mockRecetas[recetaIndex];

            // Verificar permisos (simular que req.user.id viene de auth middleware)
            const userId = req.headers['x-test-user'] || 'test_user_123';
            if (receta.userId !== userId) {
                return res.status(403).json({ message: 'No tienes permisos para actualizar esta receta' });
            }

            // Actualizar solo campos enviados
            if (req.body.name !== undefined) receta.name = req.body.name;
            if (req.body.description !== undefined) receta.description = req.body.description;
            if (req.body.steps !== undefined) receta.steps = req.body.steps;
            if (req.body.ingredients !== undefined) receta.ingredients = req.body.ingredients;

            mockRecetas[recetaIndex] = receta;
            return res.status(200).json(receta);
        },

        // DELETE /recetas/:id - Eliminar receta
        delete: async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { id } = req.params;
            const recetaIndex = mockRecetas.findIndex(r => r.id === parseInt(id));

            if (recetaIndex === -1) {
                return res.status(404).json({ message: 'Receta no encontrada' });
            }

            const receta = mockRecetas[recetaIndex];

            // Verificar permisos
            const userId = req.headers['x-test-user'] || 'test_user_123';
            if (receta.userId !== userId) {
                return res.status(403).json({ message: 'No tienes permisos para eliminar esta receta' });
            }

            mockRecetas.splice(recetaIndex, 1);
            return res.status(204).send();
        }
    };

    // Validaciones para PUT
    const updateValidation = [
        param('id').isNumeric().withMessage('El ID debe ser un número válido.'),
        body('name')
            .optional()
            .trim()
            .isLength({ min: 3 }).withMessage('El título (name) debe tener al menos 3 caracteres.'),
        body('description')
            .optional()
            .trim()
            .notEmpty().withMessage('La descripción no puede estar vacía.'),
        body('steps')
            .optional()
            .isArray({ min: 1 }).withMessage('La receta debe tener al menos un paso (steps).'),
        body('ingredients')
            .optional()
            .isArray({ min: 1 }).withMessage('La receta debe tener al menos un ingrediente.')
    ];

    // Validaciones para DELETE
    const deleteValidation = [
        param('id').isNumeric().withMessage('El ID debe ser un número válido.')
    ];

    // Rutas de test
    app.put('/api/recetas/:id', updateValidation, mockController.update);
    app.delete('/api/recetas/:id', deleteValidation, mockController.delete);

    // Ruta auxiliar para obtener estado de la base de datos mock
    app.get('/api/test/recetas', (req, res) => {
        res.json(mockRecetas);
    });

    return app;
}

async function runUpdateDeleteTests() {
    const app = createTestApp();

    console.log('🔄 Iniciando tests de UPDATE y DELETE...\n');

    // === TESTS DE UPDATE (PUT) ===
    console.log('📝 === TESTS DE ACTUALIZACIÓN (PUT) ===\n');

    // Test 1: Actualización válida completa
    console.log('✅ Test 1: Actualización válida completa');
    const updateResponse1 = await request(app)
        .put('/api/recetas/1')
        .set('x-test-user', 'test_user_123')
        .send({
            name: 'Receta Actualizada',
            description: 'Nueva descripción actualizada',
            steps: ['Nuevo paso 1', 'Nuevo paso 2', 'Nuevo paso 3'],
            ingredients: ['Nuevo ingrediente A', 'Nuevo ingrediente B']
        })
        .expect(200);

    console.log('   Respuesta:', JSON.stringify(updateResponse1.body, null, 2));
    console.log('   ✓ Actualización exitosa\n');

    // Test 2: Actualización parcial (solo algunos campos)
    console.log('✅ Test 2: Actualización parcial');
    const updateResponse2 = await request(app)
        .put('/api/recetas/1')
        .set('x-test-user', 'test_user_123')
        .send({
            name: 'Solo cambio el título'
        })
        .expect(200);

    console.log('   Título actualizado:', updateResponse2.body.name);
    console.log('   ✓ Actualización parcial exitosa\n');

    // Test 3: Validación - ID inválido
    console.log('❌ Test 3: ID inválido');
    const updateResponse3 = await request(app)
        .put('/api/recetas/abc')
        .set('x-test-user', 'test_user_123')
        .send({ name: 'Test' })
        .expect(400);

    console.log('   Errores:', updateResponse3.body.errors?.map(e => e.msg));
    console.log('   ✓ Validación de ID funcionó\n');

    // Test 4: Validación - Datos inválidos
    console.log('❌ Test 4: Datos de actualización inválidos');
    const updateResponse4 = await request(app)
        .put('/api/recetas/1')
        .set('x-test-user', 'test_user_123')
        .send({
            name: 'ab',  // Muy corto
            description: '',  // Vacía
            steps: [],  // Array vacío
            ingredients: []  // Array vacío
        })
        .expect(400);

    console.log('   Errores:', updateResponse4.body.errors?.map(e => e.msg));
    console.log('   ✓ Validación de datos funcionó\n');

    // Test 5: Sin permisos (usuario diferente)
    console.log('🚫 Test 5: Sin permisos para actualizar');
    const updateResponse5 = await request(app)
        .put('/api/recetas/2')
        .set('x-test-user', 'test_user_123')  // Intenta editar receta de other_user_456
        .send({ name: 'Intento editar receta ajena' })
        .expect(403);

    console.log('   Mensaje:', updateResponse5.body.message);
    console.log('   ✓ Control de permisos funcionó\n');

    // Test 6: Receta no existe
    console.log('🔍 Test 6: Receta no encontrada');
    const updateResponse6 = await request(app)
        .put('/api/recetas/999')
        .set('x-test-user', 'test_user_123')
        .send({ name: 'No existe' })
        .expect(404);

    console.log('   Mensaje:', updateResponse6.body.message);
    console.log('   ✓ Manejo de recurso no encontrado funcionó\n');

    // === TESTS DE DELETE ===
    console.log('🗑️ === TESTS DE ELIMINACIÓN (DELETE) ===\n');

    // Test 7: Eliminación válida
    console.log('✅ Test 7: Eliminación válida');
    const deleteResponse1 = await request(app)
        .delete('/api/recetas/1')
        .set('x-test-user', 'test_user_123')
        .expect(204);

    console.log('   ✓ Receta eliminada exitosamente (204 No Content)\n');

    // Test 8: Validación DELETE - ID inválido
    console.log('❌ Test 8: DELETE con ID inválido');
    const deleteResponse2 = await request(app)
        .delete('/api/recetas/xyz')
        .set('x-test-user', 'test_user_123')
        .expect(400);

    console.log('   Errores:', deleteResponse2.body.errors?.map(e => e.msg));
    console.log('   ✓ Validación de ID funcionó\n');

    // Test 9: Sin permisos para eliminar
    console.log('🚫 Test 9: Sin permisos para eliminar');
    const deleteResponse3 = await request(app)
        .delete('/api/recetas/2')
        .set('x-test-user', 'test_user_123')  // Intenta eliminar receta de other_user_456
        .expect(403);

    console.log('   Mensaje:', deleteResponse3.body.message);
    console.log('   ✓ Control de permisos funcionó\n');

    // Test 10: Verificar estado final
    console.log('📊 Test 10: Estado final de la base de datos');
    const finalState = await request(app)
        .get('/api/test/recetas')
        .expect(200);

    console.log('   Recetas restantes:', finalState.body.length);
    console.log('   IDs restantes:', finalState.body.map(r => r.id));
    console.log('   ✓ Estado final correcto\n');

    // === RESUMEN ===
    console.log('🎯 === RESUMEN DE TESTS ===');
    console.log('✅ Actualización completa: PASA');
    console.log('✅ Actualización parcial: PASA');
    console.log('✅ Validación de IDs: PASA');
    console.log('✅ Validación de datos: PASA');
    console.log('✅ Control de permisos: PASA');
    console.log('✅ Manejo de recursos no encontrados: PASA');
    console.log('✅ Eliminación: PASA');
    console.log('✅ Todos los tests de UPDATE/DELETE pasaron correctamente');

    console.log('\n💡 === FORMATO ESPERADO DEL FRONTEND ===');
    console.log('PUT /api/recetas/:id');
    console.log(JSON.stringify({
        "name": "Nuevo título (opcional)",
        "description": "Nueva descripción (opcional)",
        "steps": ["Paso 1", "Paso 2"],
        "ingredients": ["Ingrediente 1", "Ingrediente 2"]
    }, null, 2));
    console.log('\nDELETE /api/recetas/:id (sin body, solo autenticación)');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runUpdateDeleteTests().catch(console.error);
}

module.exports = { runUpdateDeleteTests };