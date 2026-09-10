// Health API paths for Swagger documentation

export const healthPaths = {
  '/api/v1/health': {
    get: {
      summary: 'Health check (v1 API)',
      description: 'Returns the health status of the API. No authentication required.',
      tags: ['V1 Health'],
      responses: {
        '200': {
          description: 'API is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'healthy' },
                  timestamp: { type: 'string', format: 'date-time' },
                  uptime: { type: 'number' },
                  version: { type: 'string' }
                }
              }
            }
          }
        },
        '503': { description: 'API is unhealthy' }
      }
    }
  }
};
