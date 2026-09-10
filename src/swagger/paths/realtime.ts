// Realtime API paths for Swagger documentation

export const realtimePaths = {
  '/api/realtime/presence': {
    get: {
      summary: 'Get user presence',
      description: 'Retrieve real-time user presence information.',
      tags: ['Realtime'],
      responses: {
        '200': {
          description: 'User presence data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  users: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        status: { type: 'string' },
                        lastSeen: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
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
      description: 'Retrieve real-time notification updates.',
      tags: ['Realtime'],
      responses: {
        '200': {
          description: 'Notifications retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    message: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    read: { type: 'boolean' }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/realtime/collaboration-events': {
    get: {
      summary: 'Get collaboration events',
      description: 'Retrieve real-time collaboration events.',
      tags: ['Realtime'],
      responses: {
        '200': {
          description: 'Collaboration events retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    eventType: { type: 'string' },
                    userId: { type: 'string' },
                    data: { type: 'object' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};
