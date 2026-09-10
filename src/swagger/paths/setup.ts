// Setup API paths for Swagger documentation

export const setupPaths = {
  '/api/setup/initialize': {
    post: {
      summary: 'Initialize system setup',
      description: 'Initialize the system with default settings and configurations. Requires admin privileges.',
      tags: ['Setup'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                adminEmail: { type: 'string', format: 'email' },
                adminPassword: { type: 'string' },
                companyName: { type: 'string' },
                defaultSettings: { type: 'object' }
              },
              required: ['adminEmail', 'adminPassword', 'companyName']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'System initialized successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  adminUser: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      role: { type: 'string' }
                    }
                  },
                  setupComplete: { type: 'boolean' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Insufficient permissions' }
      }
    }
  },
  '/api/setup/check-minio-bucket': {
    get: {
      summary: 'Check MinIO bucket status',
      description: 'Check if MinIO bucket is properly configured and accessible.',
      tags: ['Setup'],
      responses: {
        '200': {
          description: 'MinIO bucket status checked successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  bucketExists: { type: 'boolean' },
                  accessible: { type: 'boolean' },
                  permissions: { type: 'object' },
                  status: { type: 'string' }
                }
              }
            }
          }
        },
        '500': { description: 'MinIO connection failed' }
      }
    }
  }
};
