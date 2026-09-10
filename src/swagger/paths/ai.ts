// AI API paths for Swagger documentation

export const aiPaths = {
  '/api/ai/analyze': {
    post: {
      summary: 'Analyze content with AI',
      description: 'Analyze content using AI services.',
      tags: ['AI'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                content: { type: 'string' },
                type: { type: 'string' },
                options: { type: 'object' }
              },
              required: ['content', 'type']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Analysis completed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  analysis: { type: 'object' },
                  confidence: { type: 'number' },
                  suggestions: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid input' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/ai/generate': {
    post: {
      summary: 'Generate content with AI',
      description: 'Generate content using AI services.',
      tags: ['AI'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                prompt: { type: 'string' },
                type: { type: 'string' },
                options: { type: 'object' }
              },
              required: ['prompt', 'type']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Content generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  metadata: { type: 'object' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid input' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/v1/ai/search-applicants': {
    post: {
      summary: 'Search applicants with AI (v1 API)',
      description: 'Search for applicants using AI-powered matching. Requires Bearer token authentication.',
      tags: ['V1 AI'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query or job description' },
                positionId: { type: 'string', nullable: true, description: 'Position ID to match against' },
                filters: {
                  type: 'object',
                  properties: {
                    skills: { type: 'array', items: { type: 'string' } },
                    experience: { type: 'number', description: 'Minimum years of experience' },
                    location: { type: 'string' },
                    salary: { type: 'number' }
                  }
                },
                limit: { type: 'number', default: 20, description: 'Maximum number of results' }
              },
              required: ['query']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'AI search completed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  applicants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        applicant: { $ref: '#/components/schemas/applicant' },
                        matchScore: { type: 'number' },
                        matchedSkills: { type: 'array', items: { type: 'string' } },
                        reasoning: { type: 'string' }
                      }
                    }
                  },
                  total: { type: 'number' },
                  searchTime: { type: 'number' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid search query' },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};
