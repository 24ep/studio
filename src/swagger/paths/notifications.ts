// Notifications API paths for Swagger documentation

export const notificationsPaths = {
  '/api/v1/notifications': {
    get: {
      summary: 'Get all notifications (v1 API)',
      description: 'Returns a paginated list of notifications. Requires Bearer token authentication.',
      tags: ['V1 Notifications'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', description: 'Page number for pagination', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', description: 'Number of items per page', schema: { type: 'integer', default: 10 } },
        { name: 'read', in: 'query', description: 'Filter by read status', schema: { type: 'boolean' } }
      ],
      responses: {
        '200': {
          description: 'List of notifications',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  limit: { type: 'integer' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/realtime/notifications': {
    get: {
      summary: 'Get real-time notifications',
      description: 'Stream real-time notification updates.',
      tags: ['Realtime'],
      responses: {
        '200': {
          description: 'Real-time notifications stream',
          content: {
            'text/event-stream': {
              schema: {
                type: 'string',
                description: 'Event stream data'
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};
