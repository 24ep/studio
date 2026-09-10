// SLA Violations API paths for Swagger documentation

export const slaViolationsPaths = {
  '/api/sla-violations': {
    get: {
      summary: 'Get SLA violations',
      description: 'Get all SLA violations. Requires Bearer token authentication.',
      tags: ['SLA Violations'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'status', in: 'query', description: 'Filter by status', schema: { type: 'string' } },
        { name: 'severity', in: 'query', description: 'Filter by severity', schema: { type: 'string' } },
        { name: 'startDate', in: 'query', description: 'Start date filter', schema: { type: 'string', format: 'date' } },
        { name: 'endDate', in: 'query', description: 'End date filter', schema: { type: 'string', format: 'date' } },
        { name: 'limit', in: 'query', description: 'Number of items per page', schema: { type: 'integer', default: 20 } },
        { name: 'offset', in: 'query', description: 'Offset for pagination', schema: { type: 'integer', default: 0 } }
      ],
      responses: {
        '200': {
          description: 'SLA violations retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  violations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string' },
                        severity: { type: 'string' },
                        status: { type: 'string' },
                        description: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        resolvedAt: { type: 'string', format: 'date-time', nullable: true }
                      }
                    }
                  },
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
      summary: 'Create SLA violation',
      description: 'Create a new SLA violation. Requires Bearer token authentication.',
      tags: ['SLA Violations'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                severity: { type: 'string' },
                description: { type: 'string' },
                relatedEntity: { type: 'string' },
                entityId: { type: 'string' }
              },
              required: ['type', 'severity', 'description']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'SLA violation created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  status: { type: 'string' },
                  description: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid input' },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};
