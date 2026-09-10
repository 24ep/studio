// Transitions API paths for Swagger documentation

export const transitionsPaths = {
  '/api/v1/transitions': {
    get: {
      summary: 'Get all transitions (v1 API)',
      description: 'Returns all Applicant transitions. Requires Bearer token authentication.',
      tags: ['V1 Transitions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'applicantId', in: 'query', description: 'Filter by Applicant ID', schema: { type: 'string' } },
        { name: 'fromStage', in: 'query', description: 'Filter by from stage', schema: { type: 'string' } },
        { name: 'toStage', in: 'query', description: 'Filter by to stage', schema: { type: 'string' } },
        { name: 'limit', in: 'query', description: 'Number of items per page', schema: { type: 'integer', default: 20 } },
        { name: 'offset', in: 'query', description: 'Offset for pagination', schema: { type: 'integer', default: 0 } }
      ],
      responses: {
        '200': {
          description: 'List of transitions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  transitions: { type: 'array', items: { $ref: '#/components/schemas/Transition' } },
                  total: { type: 'integer' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      summary: 'Create a new transition (v1 API)',
      description: 'Creates a new Applicant transition. Requires Bearer token authentication.',
      tags: ['V1 Transitions'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                applicantId: { type: 'string' },
                fromStage: { type: 'string', nullable: true },
                toStage: { type: 'string' },
                notes: { type: 'string', nullable: true },
                transitionDate: { type: 'string', format: 'date-time' }
              },
              required: ['applicantId', 'toStage']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Transition created successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Transition' } } }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};
