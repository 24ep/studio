// Recruitment Stages API paths for Swagger documentation

export const recruitmentStagesPaths = {
  '/api/v1/recruitment-stages': {
    get: {
      summary: 'Get all recruitment stages (v1 API)',
      description: 'Returns all recruitment stages. Requires Bearer token authentication.',
      tags: ['V1 Recruitment Stages'],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of recruitment stages',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/RecruitmentStage' }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      summary: 'Create a new recruitment stage (v1 API)',
      description: 'Creates a new recruitment stage. Requires Bearer token authentication.',
      tags: ['V1 Recruitment Stages'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string', nullable: true },
                order: { type: 'number' },
                color: { type: 'string', nullable: true }
              },
              required: ['name', 'order']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Recruitment stage created successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RecruitmentStage' } } }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};
