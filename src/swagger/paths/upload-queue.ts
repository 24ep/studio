// Upload Queue API paths for Swagger documentation

export const uploadQueuePaths = {
  '/api/upload-queue': {
    get: {
      summary: 'Get upload queue status',
      description: 'Returns the current status of the upload queue.',
      tags: ['Upload Queue'],
      responses: {
        '200': {
          description: 'Upload queue status retrieved successfully',
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
        }
      }
    }
  },
  '/api/upload-queue/upload-file': {
    post: {
      summary: 'Upload file to queue',
      description: 'Upload a file to the processing queue.',
      tags: ['Upload Queue'],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' }
              },
              required: ['file']
            }
          }
        }
      },
      responses: {
        '200': { description: 'File uploaded to queue successfully' },
        '400': { description: 'Invalid file' }
      }
    }
  },
  '/api/upload-queue/process': {
    post: {
      summary: 'Process upload queue',
      description: 'Process all files in the upload queue.',
      tags: ['Upload Queue'],
      responses: {
        '200': { description: 'Queue processing completed' }
      }
    }
  }
};
