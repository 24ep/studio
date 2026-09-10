// Download API paths for Swagger documentation

export const downloadPaths = {
  '/api/download': {
    get: {
      summary: 'Download file',
      description: 'Download a file from the system. Requires Bearer token authentication.',
      tags: ['Download'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'fileId', in: 'query', required: true, description: 'File ID to download', schema: { type: 'string' } },
        { name: 'type', in: 'query', description: 'File type (resume, attachment, etc.)', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'File downloaded successfully',
          content: {
            'application/octet-stream': {
              schema: {
                type: 'string',
                format: 'binary'
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'File not found' },
        '403': { description: 'Access denied' }
      }
    }
  }
};
