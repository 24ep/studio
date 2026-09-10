// User Preferences API paths for Swagger documentation

export const userPreferencesPaths = {
  '/api/user-preferences': {
    get: {
      summary: 'Get user preferences',
      description: 'Get current user preferences. Requires Bearer token authentication.',
      tags: ['User Preferences'],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'User preferences retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  theme: { type: 'string' },
                  language: { type: 'string' },
                  notifications: { type: 'object' },
                  dashboard: { type: 'object' },
                  filters: { type: 'object' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    put: {
      summary: 'Update user preferences',
      description: 'Update current user preferences. Requires Bearer token authentication.',
      tags: ['User Preferences'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                theme: { type: 'string' },
                language: { type: 'string' },
                notifications: { type: 'object' },
                dashboard: { type: 'object' },
                filters: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'User preferences updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  preferences: { type: 'object' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid input' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/user-preferences/{userId}': {
    get: {
      summary: 'Get user preferences by user ID',
      description: 'Get preferences for a specific user. Requires Bearer token authentication and admin privileges.',
      tags: ['User Preferences'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'userId', in: 'path', required: true, description: 'User ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'User preferences retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  theme: { type: 'string' },
                  language: { type: 'string' },
                  notifications: { type: 'object' },
                  dashboard: { type: 'object' },
                  filters: { type: 'object' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Insufficient permissions' },
        '404': { description: 'User not found' }
      }
    }
  }
};
