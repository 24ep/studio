// Settings API paths for Swagger documentation

export const settingsPaths = {
  '/api/settings': {
    get: {
      summary: 'Get all settings',
      description: 'Retrieve all system settings.',
      tags: ['Settings'],
      responses: {
        '200': {
          description: 'Settings retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  general: { type: 'object' },
                  notifications: { type: 'object' },
                  security: { type: 'object' },
                  integrations: { type: 'object' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    put: {
      summary: 'Update settings',
      description: 'Update system settings.',
      tags: ['Settings'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                general: { type: 'object' },
                notifications: { type: 'object' },
                security: { type: 'object' },
                integrations: { type: 'object' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Settings updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  settings: { type: 'object' }
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
