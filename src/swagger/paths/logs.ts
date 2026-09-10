// Logs API paths for Swagger documentation

export const logsPaths = {
  '/api/logs': {
    get: {
      summary: 'Get system logs',
      description: 'Retrieve system logs with optional filtering.',
      tags: ['Logs'],
      parameters: [
        {
          name: 'level',
          in: 'query',
          schema: { type: 'string', enum: ['error', 'warn', 'info', 'debug'] },
          description: 'Filter logs by level'
        },
        {
          name: 'startDate',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
          description: 'Start date for log filtering'
        },
        {
          name: 'endDate',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
          description: 'End date for log filtering'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'number', default: 100 },
          description: 'Maximum number of logs to return'
        }
      ],
      responses: {
        '200': {
          description: 'Logs retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    level: { type: 'string' },
                    message: { type: 'string' },
                    timestamp: { type: 'string', format: 'date-time' },
                    context: { type: 'object' }
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
