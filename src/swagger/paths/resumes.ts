// Resumes API paths for Swagger documentation

export const resumesPaths = {
  '/api/resumes/upload': {
    post: {
      summary: 'Upload resume',
      description: 'Upload a resume file. Requires Bearer token authentication.',
      tags: ['Resumes'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary', description: 'Resume file' },
                applicantId: { type: 'string', description: 'Applicant ID to associate with' },
                title: { type: 'string', description: 'Resume title' },
                isPrimary: { type: 'boolean', default: false, description: 'Set as primary resume' }
              },
              required: ['file']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Resume uploaded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  filename: { type: 'string' },
                  size: { type: 'number' },
                  mimeType: { type: 'string' },
                  url: { type: 'string' },
                  applicantId: { type: 'string' },
                  isPrimary: { type: 'boolean' },
                  uploadedAt: { type: 'string', format: 'date-time' }
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
  }
};
