// Upload API paths for Swagger documentation

export const uploadPaths = {
  '/api/upload-image': {
    post: {
      summary: 'Upload image',
      description: 'Upload an image file to the system.',
      tags: ['Upload'],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description: 'Image file to upload'
                },
                type: {
                  type: 'string',
                  description: 'Type of image (avatar, logo, etc.)'
                }
              },
              required: ['file']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Image uploaded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  filename: { type: 'string' },
                  size: { type: 'number' },
                  mimeType: { type: 'string' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid file or missing file' },
        '401': { description: 'Unauthorized' },
        '413': { description: 'File too large' }
      }
    }
  },
  '/api/fetch-image': {
    get: {
      summary: 'Fetch image',
      description: 'Fetch an image from the system.',
      tags: ['Upload'],
      parameters: [
        {
          name: 'filename',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Name of the image file'
        }
      ],
      responses: {
        '200': {
          description: 'Image retrieved successfully',
          content: {
            'image/*': {
              schema: {
                type: 'string',
                format: 'binary'
              }
            }
          }
        },
        '404': { description: 'Image not found' }
      }
    }
  }
};
