const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Backend Ledger API",
            version: "1.0.0",
            description: "Production-grade double-entry ledger and transaction system with fraud detection, built as a modular monolith.",
            contact: {
                name: "Rajan"
            }
        },
        servers: [
            {
                url: "http://localhost:3000/api",
                description: "Local development server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },
            schemas: {
                ApiResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        statusCode: { type: "integer" },
                        message: { type: "string" },
                        data: { type: "object" }
                    }
                },
                ApiError: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        message: { type: "string" },
                        requestId: { type: "string" }
                    }
                }
            }
        },
        security: [
            { bearerAuth: [] }
        ]
    },
    apis: [
        "./src/modules/**/*.routes.js"
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;