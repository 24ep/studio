// Process Queue API paths for Swagger documentation

export const processQueuePaths = {
  '/api/process-queue': {
    get: {
      summary: 'Get process queue status',
      description: 'Retrieve the current status of the process queue.',
      tags: ['Process Queue'],
      responses: {
        '200': {
          description: 'Process queue status retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  queueLength: { type: 'number' },
                  processing: { type: 'number' },
                  completed: { type: 'number' },
                  failed: { type: 'number' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      summary: 'Add item to process queue',
      description: 'Add a new item to the process queue.',
      tags: ['Process Queue'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                data: { type: 'object' },
                priority: { type: 'number' }
              },
              required: ['type', 'data']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Item added to queue successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  position: { type: 'number' }
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
