// Headcount API paths for Swagger documentation

export const headcountPaths = {
  '/api/headcount': {
    get: {
      summary: 'Get headcount data',
      description: 'Get headcount information and statistics. Requires Bearer token authentication.',
      tags: ['Headcount'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'department', in: 'query', description: 'Filter by department', schema: { type: 'string' } },
        { name: 'year', in: 'query', description: 'Filter by year', schema: { type: 'integer' } },
        { name: 'month', in: 'query', description: 'Filter by month', schema: { type: 'integer' } }
      ],
      responses: {
        '200': {
          description: 'Headcount data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  totalHeadcount: { type: 'number' },
                  byDepartment: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        department: { type: 'string' },
                        count: { type: 'number' },
                        growth: { type: 'number' }
                      }
                    }
                  },
                  trends: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string', format: 'date' },
                        count: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      summary: 'Create headcount record',
      description: 'Create a new headcount record. Requires Bearer token authentication.',
      tags: ['Headcount'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                department: { type: 'string' },
                position: { type: 'string' },
                count: { type: 'number' },
                date: { type: 'string', format: 'date' },
                notes: { type: 'string', nullable: true }
              },
              required: ['department', 'position', 'count', 'date']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Headcount record created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  department: { type: 'string' },
                  position: { type: 'string' },
                  count: { type: 'number' },
                  date: { type: 'string', format: 'date' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/headcount/{id}': {
    get: {
      summary: 'Get headcount record by ID',
      description: 'Get a specific headcount record. Requires Bearer token authentication.',
      tags: ['Headcount'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Headcount record ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Headcount record retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  department: { type: 'string' },
                  position: { type: 'string' },
                  count: { type: 'number' },
                  date: { type: 'string', format: 'date' },
                  notes: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Headcount record not found' }
      }
    },
    put: {
      summary: 'Update headcount record',
      description: 'Update a headcount record. Requires Bearer token authentication.',
      tags: ['Headcount'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Headcount record ID', schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                department: { type: 'string' },
                position: { type: 'string' },
                count: { type: 'number' },
                date: { type: 'string', format: 'date' },
                notes: { type: 'string', nullable: true }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Headcount record updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  department: { type: 'string' },
                  position: { type: 'string' },
                  count: { type: 'number' },
                  date: { type: 'string', format: 'date' },
                  notes: { type: 'string', nullable: true },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Headcount record not found' }
      }
    },
    delete: {
      summary: 'Delete headcount record',
      description: 'Delete a headcount record. Requires Bearer token authentication.',
      tags: ['Headcount'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Headcount record ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Headcount record deleted successfully' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Headcount record not found' }
      }
    }
  }
};
