// Automation API paths for Swagger documentation

export const automationPaths = {
  '/api/automation/webhook-proxy': {
    post: {
      summary: 'Webhook proxy',
      description: 'Proxy webhook requests to internal services. Requires Bearer token authentication.',
      tags: ['Automation'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                event: { type: 'string' },
                data: { type: 'object' },
                source: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' }
              },
              required: ['event', 'data']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Webhook processed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                  processedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid webhook data' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/automation/create-applicant-with-matches': {
    post: {
      summary: 'Create applicant with matches',
      description: 'Create an applicant and automatically generate job matches. Requires Bearer token authentication.',
      tags: ['Automation'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                applicant: {
                  type: 'object',
                  properties: {
                    personal_info: { type: 'object' },
                    contact_info: { type: 'object' },
                    skills: { type: 'array', items: { type: 'object' } },
                    educationData: { type: 'array', items: { type: 'object' } },
                    experienceData: { type: 'array', items: { type: 'object' } }
                  }
                },
                autoMatch: { type: 'boolean', default: true },
                matchThreshold: { type: 'number', default: 0.7 }
              },
              required: ['applicant']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Applicant created with matches successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  applicant: { $ref: '#/components/schemas/applicant' },
                  matches: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        positionId: { type: 'string' },
                        matchScore: { type: 'number' },
                        matchedSkills: { type: 'array', items: { type: 'string' } }
                      }
                    }
                  },
                  totalMatches: { type: 'number' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid applicant data' },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};
