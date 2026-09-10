// Applicant Sources API paths for Swagger documentation

export const ApplicantSourcesPaths = {
  '/api/v1/Applicant-sources': {
    get: {
      summary: 'Get all Applicant sources (v1 API)',
      description: 'Returns all Applicant sources. Requires Bearer token authentication.',
      tags: ['V1 Applicant Sources'],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of Applicant sources',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/ApplicantSource' }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      summary: 'Create a new Applicant source (v1 API)',
      description: 'Creates a new Applicant source. Requires Bearer token authentication.',
      tags: ['V1 Applicant Sources'],
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
                type: { type: 'string' },
                url: { type: 'string', nullable: true }
              },
              required: ['name', 'type']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Applicant source created successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicantSource' } } }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};
