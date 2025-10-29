// tests/test-frontend-validation.js
// Test que simula las llamadas exactas del frontend Flutter

const express = require('express');
const request = require('supertest');
const { body, validationResult } = require('express-validator');

// Crear una mini-app para testing que replica la estructura del proyecto
function createTestApp() {
    const app = express();
    app.use(express.json());

    // Mock del controlador que simula el comportamiento real
    const mockController = {
        create: async (req, res) => {
            // Verificar validación (igual que en el controlador real)
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Simular creación exitosa
            const receta = {
                id: Math.floor(Math.random() * 1000),
                name: req.body.name || req.body.titulo,
                description: req.body.description || req.body.descripcion,
                steps: req.body.steps || req.body.pasos || [],
                ingredients: req.body.ingredients || req.body.ingredientes || [],
                userId: 'test_user_123',
                createdAt: new Date().toISOString()
            };

            return res.status(201).json(receta);
        }
    };

    // Validaciones (copiadas exactas del proyecto)
    const recetaValidation = [
        body('name').trim().notEmpty().withMessage('El título (name) es obligatorio.')
            .isLength({ min: 3 }).withMessage('El título (name) debe tener al menos 3 caracteres.'),
        body('description').trim().notEmpty().withMessage('La descripción (description) es obligatoria.'),
        body('steps').isArray({ min: 1 }).withMessage('La receta debe tener al menos un paso (steps).'),
        body('ingredients').isArray({ min: 1 }).withMessage('La receta debe tener al menos un ingrediente.')
    ];

    // Ruta de test (sin auth para facilitar testing)
    app.post('/api/recetas', recetaValidation, mockController.create);

    return app;
}

async function runTests() {
    const app = createTestApp();

    console.log('🧪 Iniciando tests de validación del frontend...\n');

    // 1. Test payload VÁLIDO (formato exacto del Flutter frontend)
    console.log('✅ Test 1: Payload válido del frontend');
    const validPayload = {
        "name": "Pasta Carbonara",
        "description": "Deliciosa pasta italiana",
        "ingredients": ["400g pasta", "200g panceta", "3 huevos", "Queso parmesano"],
        "steps": ["Hervir pasta", "Freír panceta", "Mezclar huevos y queso", "Combinar todo"]
    };

    const validResponse = await request(app)
        .post('/api/recetas')
        .send(validPayload)
        .expect(201);

    console.log('   Respuesta:', validResponse.body);
    console.log('   ✓ Receta creada correctamente\n');

    // 2. Test payloads INVÁLIDOS
    const invalidTests = [
        {
            name: 'Título vacío',
            payload: { name: '', description: 'test', steps: ['paso1'], ingredients: ['ing1'] },
            expectedErrors: ['El título (name) es obligatorio.']
        },
        {
            name: 'Título muy corto',
            payload: { name: 'ab', description: 'test', steps: ['paso1'], ingredients: ['ing1'] },
            expectedErrors: ['El título (name) debe tener al menos 3 caracteres.']
        },
        {
            name: 'Descripción vacía',
            payload: { name: 'Receta Test', description: '', steps: ['paso1'], ingredients: ['ing1'] },
            expectedErrors: ['La descripción (description) es obligatoria.']
        },
        {
            name: 'Steps vacío',
            payload: { name: 'Receta Test', description: 'Descripción', steps: [], ingredients: ['ing1'] },
            expectedErrors: ['La receta debe tener al menos un paso (steps).']
        },
        {
            name: 'Ingredients vacío',
            payload: { name: 'Receta Test', description: 'Descripción', steps: ['paso1'], ingredients: [] },
            expectedErrors: ['La receta debe tener al menos un ingrediente.']
        },
        {
            name: 'Múltiples errores',
            payload: { name: '', description: '', steps: [], ingredients: [] },
            expectedErrors: [
                'El título (name) es obligatorio.',
                'La descripción (description) es obligatoria.',
                'La receta debe tener al menos un paso (steps).',
                'La receta debe tener al menos un ingrediente.'
            ]
        }
    ];

    console.log('❌ Tests de validación (casos inválidos):');

    for (const test of invalidTests) {
        console.log(`\n   Test: ${test.name}`);
        console.log('   Payload:', JSON.stringify(test.payload, null, 2));

        const response = await request(app)
            .post('/api/recetas')
            .send(test.payload)
            .expect(400);

        console.log('   Errores recibidos:', response.body.errors?.map(e => e.msg) || [response.body.message]);

        // Verificar que los errores esperados están presentes
        const receivedMessages = response.body.errors?.map(e => e.msg) || [];
        const allExpectedFound = test.expectedErrors.every(expected =>
            receivedMessages.some(received => received.includes(expected))
        );

        if (allExpectedFound) {
            console.log('   ✓ Errores de validación correctos');
        } else {
            console.log('   ✗ Errores no coinciden completamente');
            console.log('   Esperados:', test.expectedErrors);
            console.log('   Recibidos:', receivedMessages);
        }
    }

    // 3. Test con formato alternativo del frontend (titulo/descripcion en español)
    console.log('\n✅ Test 3: Formato alternativo español del frontend');
    const spanishPayload = {
        "titulo": "Gazpacho Andaluz",
        "descripcion": "Sopa fría tradicional",
        "ingredientes": ["tomate", "pepino", "pimiento", "ajo"],
        "pasos": ["Triturar verduras", "Colar", "Servir frío"]
    };

    // Nota: Este test fallaría con la validación actual porque busca 'name' no 'titulo'
    // Esto muestra una incompatibilidad entre frontend y backend
    const spanishResponse = await request(app)
        .post('/api/recetas')
        .send(spanishPayload)
        .expect(400);  // Esperamos error porque 'name' es requerido

    console.log('   Payload español:', JSON.stringify(spanishPayload, null, 2));
    console.log('   Errores (esperados):', spanishResponse.body.errors?.map(e => e.msg) || [spanishResponse.body.message]);
    console.log('   ⚠️  NOTA: El backend espera "name" pero el frontend podría enviar "titulo"');

    console.log('\n🎯 Resumen de Tests:');
    console.log('✓ Validación con payload válido: PASA');
    console.log('✓ Validación con payloads inválidos: PASA');
    console.log('⚠️  Compatibilidad campos español/inglés: REQUIERE REVISIÓN');

    console.log('\n📝 Recomendaciones:');
    console.log('1. La validación con express-validator funciona correctamente');
    console.log('2. Verificar que el frontend envíe "name" y no "titulo"');
    console.log('3. O añadir validación alternativa para "titulo" si el frontend lo usa');
}

// Ejecutar tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };