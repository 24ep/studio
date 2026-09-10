// Link Preview API paths for Swagger documentation

export const linkPreviewPaths = {
  '/api/link-preview': {
    post: {
      summary: 'Get link preview',
      description: 'Get preview information for a URL including title, description, and image.',
      tags: ['Link Preview'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                url: { type: 'string', format: 'uri' }
              },
              required: ['url']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Link preview retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  image: { type: 'string', format: 'uri' },
                  url: { type: 'string', format: 'uri' },
                  siteName: { type: 'string' },
                  favicon: { type: 'string', format: 'uri' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid URL' },
        '404': { description: 'Link preview not available' },
        '500': { description: 'Failed to fetch link preview' }
      }
    }
  }
};
