// tests/test-image-validation.js
const supertest = require('supertest');
const express = require('express');
const { body } = require('express-validator');

/**
 * Test completo para validación de imageUrl en recetas
 * Verifica que el campo imageUrl funciona correctamente en POST y PUT
 */

// Mock del controlador para pruebas
const mockController = {
    create: (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.status(201).json({
            id: 123,
            name: req.body.name,
            description: req.body.description,
            steps: req.body.steps,
            ingredients: req.body.ingredients,
            imageUrl: req.body.imageUrl,
            userId: 'test-user-123',
            createdAt: new Date().toISOString()
        });
    },

    updateById: (req, res) => {
        const errors = require('express-validator').validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        res.status(200).json({
            id: parseInt(req.params.id),
            name: req.body.name || 'Receta existente',
            description: req.body.description || 'Descripción existente',
            steps: req.body.steps || ['Paso 1'],
            ingredients: req.body.ingredients || ['Ingrediente 1'],
            imageUrl: req.body.imageUrl,
            userId: 'test-user-123',
            createdAt: '2025-10-29T10:00:00.000Z'
        });
    }
};

// Mock del middleware de autenticación
const mockAuth = (req, res, next) => {
    req.user = { id: 'test-user-123' };
    next();
};

// Configurar app de prueba
const app = express();
app.use(express.json());

// Rutas con validación de imageUrl
app.post('/api/recetas',
    mockAuth,
    [
        body('name').trim().notEmpty().isLength({ min: 3 }),
        body('description').trim().notEmpty(),
        body('steps').isArray({ min: 1 }),
        body('ingredients').isArray({ min: 1 }),
        body('imageUrl')
            .optional()
            .trim()
            .isURL({ protocols: ['http', 'https'], require_protocol: true })
            .withMessage('La URL de la imagen debe ser válida (http/https).')
            .isLength({ max: 2000 })
            .withMessage('La URL de la imagen no puede exceder 2000 caracteres.')
    ],
    mockController.create
);

app.put('/api/recetas/:id',
    mockAuth,
    [
        require('express-validator').param('id').isNumeric(),
        body('name').optional().trim().isLength({ min: 3 }),
        body('description').optional().trim().notEmpty(),
        body('steps').optional().isArray({ min: 1 }),
        body('ingredients').optional().isArray({ min: 1 }),
        body('imageUrl')
            .optional()
            .trim()
            .isURL({ protocols: ['http', 'https'], require_protocol: true })
            .withMessage('La URL de la imagen debe ser válida (http/https).')
            .isLength({ max: 2000 })
            .withMessage('La URL de la imagen no puede exceder 2000 caracteres.')
    ],
    mockController.updateById
);

const request = supertest(app);

// Tests para el campo imageUrl
async function runImageValidationTests() {
    console.log('🖼️  INICIANDO TESTS DE VALIDACIÓN DE IMÁGENES\n');

    const tests = [
        {
            name: '✅ POST con imageUrl válida (HTTPS)',
            test: async () => {
                const payload = {
                    name: 'Receta con imagen',
                    description: 'Descripción con imagen',
                    steps: ['Paso 1'],
                    ingredients: ['Ingrediente 1'],
                    imageUrl: 'https://ejemplo.com/imagen.jpg'
                };

                const response = await request
                    .post('/api/recetas')
                    .send(payload)
                    .expect(201);

                if (response.body.imageUrl !== payload.imageUrl) {
                    throw new Error(`ImageUrl esperada: ${payload.imageUrl}, recibida: ${response.body.imageUrl}`);
                }
            }
        },

        {
            name: '✅ POST con imageUrl válida (HTTP)',
            test: async () => {
                const payload = {
                    name: 'Receta con imagen HTTP',
                    description: 'Descripción con imagen HTTP',
                    steps: ['Paso 1'],
                    ingredients: ['Ingrediente 1'],
                    imageUrl: 'http://ejemplo.com/imagen.png'
                };

                const response = await request
                    .post('/api/recetas')
                    .send(payload)
                    .expect(201);

                if (response.body.imageUrl !== payload.imageUrl) {
                    throw new Error(`ImageUrl esperada: ${payload.imageUrl}, recibida: ${response.body.imageUrl}`);
                }
            }
        },

        {
            name: '✅ POST sin imageUrl (campo opcional)',
            test: async () => {
                const payload = {
                    name: 'Receta sin imagen',
                    description: 'Descripción sin imagen',
                    steps: ['Paso 1'],
                    ingredients: ['Ingrediente 1']
                    // No se incluye imageUrl
                };

                const response = await request
                    .post('/api/recetas')
                    .send(payload)
                    .expect(201);

                // imageUrl debería ser undefined o null
                if (response.body.imageUrl !== undefined && response.body.imageUrl !== null) {
                    throw new Error(`ImageUrl debería ser undefined/null, recibida: ${response.body.imageUrl}`);
                }
            }
        },

        {
            name: '❌ POST con imageUrl inválida (sin protocolo)',
            test: async () => {
                const payload = {
                    name: 'Receta con URL inválida',
                    description: 'Descripción',
                    steps: ['Paso 1'],
                    ingredients: ['Ingrediente 1'],
                    imageUrl: 'www.ejemplo.com/imagen.jpg'
                };

                const response = await request
                    .post('/api/recetas')
                    .send(payload)
                    .expect(400);

                const errorFound = response.body.errors.some(error =>
                    error.param === 'imageUrl' &&
                    error.msg.includes('válida')
                );

                if (!errorFound) {
                    throw new Error('Debería haber un error de validación para imageUrl');
                }
            }
        },

        {
            name: '❌ POST con imageUrl muy larga (>2000 caracteres)',
            test: async () => {
                const longUrl = 'https://ejemplo.com/' + 'a'.repeat(2000);
                const payload = {
                    name: 'Receta con URL muy larga',
                    description: 'Descripción',
                    steps: ['Paso 1'],
                    ingredients: ['Ingrediente 1'],
                    imageUrl: longUrl
                };

                const response = await request
                    .post('/api/recetas')
                    .send(payload)
                    .expect(400);

                const errorFound = response.body.errors.some(error =>
                    error.param === 'imageUrl' &&
                    error.msg.includes('2000 caracteres')
                );

                if (!errorFound) {
                    throw new Error('Debería haber un error de longitud para imageUrl');
                }
            }
        },

        {
            name: '✅ PUT actualizar solo imageUrl',
            test: async () => {
                const payload = {
                    imageUrl: 'https://nuevaimagen.com/foto.jpg'
                };

                const response = await request
                    .put('/api/recetas/123')
                    .send(payload)
                    .expect(200);

                if (response.body.imageUrl !== payload.imageUrl) {
                    throw new Error(`ImageUrl esperada: ${payload.imageUrl}, recibida: ${response.body.imageUrl}`);
                }
            }
        },

        {
            name: '✅ PUT remover imageUrl (null)',
            test: async () => {
                const payload = {
                    imageUrl: null
                };

                const response = await request
                    .put('/api/recetas/123')
                    .send(payload)
                    .expect(200);

                if (response.body.imageUrl !== null) {
                    throw new Error(`ImageUrl debería ser null, recibida: ${response.body.imageUrl}`);
                }
            }
        },

        {
            name: '❌ PUT con imageUrl inválida (protocolo FTP)',
            test: async () => {
                const payload = {
                    imageUrl: 'ftp://servidor.com/imagen.jpg'
                };

                const response = await request
                    .put('/api/recetas/123')
                    .send(payload)
                    .expect(400);

                const errorFound = response.body.errors.some(error =>
                    error.param === 'imageUrl' &&
                    error.msg.includes('válida')
                );

                if (!errorFound) {
                    throw new Error('Debería haber un error de protocolo para imageUrl');
                }
            }
        }
    ];

    // Ejecutar todos los tests
    let passed = 0;
    let failed = 0;

    for (const testCase of tests) {
        try {
            await testCase.test();
            console.log(`${testCase.name} - PASÓ`);
            passed++;
        } catch (error) {
            console.log(`${testCase.name} - FALLÓ: ${error.message}`);
            failed++;
        }
    }

    console.log(`\n📊 RESUMEN DE TESTS DE IMÁGENES:`);
    console.log(`✅ Pasaron: ${passed}`);
    console.log(`❌ Fallaron: ${failed}`);
    console.log(`📈 Total: ${passed + failed}`);

    if (failed === 0) {
        console.log('\n🎉 ¡Todos los tests de validación de imágenes pasaron!');
    } else {
        console.log('\n⚠️  Algunos tests fallaron. Revisar implementación.');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runImageValidationTests().catch(console.error);
}

module.exports = { runImageValidationTests };