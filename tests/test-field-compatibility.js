// tests/test-field-compatibility.js
// Test para verificar compatibilidad entre campos del frontend (titulo/name, etc.)

const express = require('express');
const request = require('supertest');
const { body, validationResult } = require('express-validator');

// Crear una app de test con validación flexible que acepta tanto formato inglés como español
function createCompatibleApp() {
    const app = express();
    app.use(express.json());

    const mockController = {
        create: async (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            // Normalizar campos: acepta tanto inglés como español
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

    // Validación MEJORADA que acepta campos en español E inglés
    const flexibleValidation = [
        // Acepta tanto 'name' como 'titulo'
        body(['name', 'titulo'])
            .custom((value, { req }) => {
                const name = req.body.name || req.body.titulo;
                if (!name || name.trim() === '') {
                    throw new Error('El título es obligatorio (name o titulo)');
                }
                if (name.trim().length < 3) {
                    throw new Error('El título debe tener al menos 3 caracteres');
                }
                return true;
            }),

        // Acepta tanto 'description' como 'descripcion'
        body(['description', 'descripcion'])
            .custom((value, { req }) => {
                const desc = req.body.description || req.body.descripcion;
                if (!desc || desc.trim() === '') {
                    throw new Error('La descripción es obligatoria (description o descripcion)');
                }
                return true;
            }),

        // Acepta tanto 'steps' como 'pasos'
        body(['steps', 'pasos'])
            .custom((value, { req }) => {
                const steps = req.body.steps || req.body.pasos;
                if (!Array.isArray(steps) || steps.length === 0) {
                    throw new Error('Se requiere al menos un paso (steps o pasos)');
                }
                return true;
            }),

        // Acepta tanto 'ingredients' como 'ingredientes'
        body(['ingredients', 'ingredientes'])
            .custom((value, { req }) => {
                const ingredients = req.body.ingredients || req.body.ingredientes;
                if (!Array.isArray(ingredients) || ingredients.length === 0) {
                    throw new Error('Se requiere al menos un ingrediente (ingredients o ingredientes)');
                }
                return true;
            })
    ];

    app.post('/api/recetas-flexible', flexibleValidation, mockController.create);

    return app;
}

async function testFieldCompatibility() {
    const app = createCompatibleApp();

    console.log('🌍 Test de compatibilidad de campos frontend/backend\n');

    // Test casos mixtos
    const testCases = [
        {
            name: 'Formato inglés puro (como documentación)',
            payload: {
                "name": "English Recipe",
                "description": "Recipe in English",
                "steps": ["Step 1", "Step 2"],
                "ingredients": ["ingredient A", "ingredient B"]
            },
            shouldPass: true
        },
        {
            name: 'Formato español puro',
            payload: {
                "titulo": "Receta en Español",
                "descripcion": "Descripción en español",
                "pasos": ["Paso 1", "Paso 2"],
                "ingredientes": ["ingrediente A", "ingrediente B"]
            },
            shouldPass: true
        },
        {
            name: 'Formato mixto (inglés-español)',
            payload: {
                "name": "Mixed Recipe",
                "descripcion": "Descripción mixta",
                "steps": ["Step 1", "Step 2"],
                "ingredientes": ["ingredient A", "ingredient B"]
            },
            shouldPass: true
        },
        {
            name: 'Formato inválido (campos faltantes)',
            payload: {
                "titulo": "",
                "steps": [],
                "ingredients": ["ingredient A"]
            },
            shouldPass: false
        }
    ];

    for (const testCase of testCases) {
        console.log(`📝 Test: ${testCase.name}`);
        console.log('   Payload:', JSON.stringify(testCase.payload, null, 2));

        const response = await request(app)
            .post('/api/recetas-flexible')
            .send(testCase.payload);

        if (testCase.shouldPass) {
            if (response.status === 201) {
                console.log('   ✅ PASÓ - Receta creada correctamente');
                console.log('   Respuesta:', JSON.stringify(response.body, null, 2));
            } else {
                console.log('   ❌ FALLÓ - Se esperaba éxito pero hubo error:', response.status);
                console.log('   Errores:', response.body.errors?.map(e => e.msg) || [response.body.message]);
            }
        } else {
            if (response.status === 400) {
                console.log('   ✅ PASÓ - Validación detectó errores correctamente');
                console.log('   Errores:', response.body.errors?.map(e => e.msg) || [response.body.message]);
            } else {
                console.log('   ❌ FALLÓ - Se esperaba error 400 pero se obtuvo:', response.status);
            }
        }
        console.log();
    }

    console.log('💡 IMPLEMENTACIÓN SUGERIDA para el backend real:');
    console.log('');
    console.log('```javascript');
    console.log('// En src/api/routes/receta.routes.js - Validación flexible:');
    console.log('const flexibleValidation = [');
    console.log('    body([\'name\', \'titulo\'])');
    console.log('        .custom((value, { req }) => {');
    console.log('            const name = req.body.name || req.body.titulo;');
    console.log('            if (!name || name.trim() === \'\') {');
    console.log('                throw new Error(\'El título es obligatorio\');');
    console.log('            }');
    console.log('            if (name.trim().length < 3) {');
    console.log('                throw new Error(\'El título debe tener al menos 3 caracteres\');');
    console.log('            }');
    console.log('            return true;');
    console.log('        }),');
    console.log('    // ... similar para otros campos');
    console.log('];');
    console.log('```');
    console.log('');
    console.log('🎯 Esto permitiría que el frontend envíe cualquiera de los dos formatos.');
}

if (require.main === module) {
    testFieldCompatibility().catch(console.error);
}

module.exports = { testFieldCompatibility };