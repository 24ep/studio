// @ts-ignore
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Studio API',
      version: '1.0.0',
      description: 'API documentation for all endpoints',
    },
    servers: [
      { url: 'http://localhost:3000' },
    ],
    components: {
      schemas: {
        Candidate: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            positionId: { type: 'string', format: 'uuid', nullable: true },
            recruiterId: { type: 'string', format: 'uuid', nullable: true },
            fitScore: { type: 'number', minimum: 0, maximum: 100 },
            status: { type: 'string' },
            parsedData: { type: 'object', additionalProperties: true, nullable: true },
            custom_attributes: { type: 'object', additionalProperties: true, nullable: true },
            resumePath: { type: 'string', nullable: true },
            transitionNotes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['name', 'email', 'status'],
        },
        Position: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            department: { type: 'string' },
            description: { type: 'string', nullable: true },
            isOpen: { type: 'boolean' },
            position_level: { type: 'string', nullable: true },
            custom_attributes: { type: 'object', additionalProperties: true, nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['title', 'department', 'isOpen'],
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string' },
            modulePermissions: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['name', 'email', 'role'],
        },
        CustomFieldDefinition: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            model_name: { type: 'string' },
            field_key: { type: 'string' },
            label: { type: 'string' },
            field_type: { type: 'string' },
            options: { type: 'object', additionalProperties: true, nullable: true },
            is_required: { type: 'boolean' },
            sort_order: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
          required: ['model_name', 'field_key', 'label', 'field_type', 'is_required', 'sort_order'],
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec; 