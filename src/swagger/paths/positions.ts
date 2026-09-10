// Positions API paths for Swagger documentation

export const positionsPaths = {
  '/api/v1/positions': {
    get: {
      summary: 'Get all positions (v1 API)',
      description: 'Returns a paginated list of positions. Requires Bearer token authentication.',
      tags: ['V1 Positions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'title', in: 'query', description: 'Filter by position title', schema: { type: 'string' } },
        { name: 'department', in: 'query', description: 'Filter by department (comma-separated)', schema: { type: 'string' } },
        { name: 'isOpen', in: 'query', description: 'Filter by open status', schema: { type: 'boolean' } },
        { name: 'positionLevel', in: 'query', description: 'Filter by position level', schema: { type: 'string' } },
        { name: 'limit', in: 'query', description: 'Number of items per page', schema: { type: 'integer', default: 20 } },
        { name: 'offset', in: 'query', description: 'Offset for pagination', schema: { type: 'integer', default: 0 } }
      ],
      responses: {
        '200': {
          description: 'List of positions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: { type: 'array', items: { $ref: '#/components/schemas/Position' } },
                  total: { type: 'integer' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      summary: 'Create a new position (v1 API)',
      description: 'Creates a new position. Requires Bearer token authentication.',
      tags: ['V1 Positions'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                department: { type: 'string' },
                description: { type: 'string', nullable: true },
                matchCriteria: { type: 'string', nullable: true, description: 'Match criteria in HTML format' },
                isOpen: { type: 'boolean' },
                positionLevel: { type: 'string', nullable: true },
                customAttributes: { type: 'object', additionalProperties: true, nullable: true }
              },
              required: ['title', 'department', 'isOpen']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Position created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Position' }
            }
          }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Insufficient permissions' }
      }
    }
  },
  '/api/v1/positions/{id}': {
    get: {
      summary: 'Get position by ID (v1 API)',
      description: 'Returns details for a specific position. Requires Bearer token authentication.',
      tags: ['V1 Positions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Position ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Position details',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Position' } } }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Position not found' }
      }
    },
    put: {
      summary: 'Update position by ID (v1 API)',
      description: 'Updates a position. Requires Bearer token authentication and Admin or POSITIONS_EDIT_BASIC permission.',
      tags: ['V1 Positions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Position ID', schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                department: { type: 'string' },
                description: { type: 'string', nullable: true },
                matchCriteria: { type: 'string', nullable: true },
                isOpen: { type: 'boolean' },
                positionLevel: { type: 'string', nullable: true },
                customAttributes: { type: 'object', additionalProperties: true, nullable: true }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Position updated successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Position' } } }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Insufficient permissions' },
        '404': { description: 'Position not found' }
      }
    },
    delete: {
      summary: 'Delete position by ID (v1 API)',
      description: 'Deletes a position. Requires Bearer token authentication and Admin or POSITIONS_DELETE permission.',
      tags: ['V1 Positions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Position ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Position deleted successfully' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Insufficient permissions' },
        '404': { description: 'Position not found' }
      }
    }
  },
  '/api/v1/positions/bulk-action': {
    post: {
      summary: 'Bulk action on positions (v1 API)',
      description: 'Perform bulk actions on multiple positions including delete, status update, department update, and match criteria update. Requires Bearer token authentication and Admin or POSITIONS_EDIT_DETAILED permission.',
      tags: ['V1 Positions'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                action: { type: 'string', enum: ['delete', 'update_status', 'update_department', 'update_match_criteria'] },
                positionIds: { type: 'array', items: { type: 'string' } },
                data: { type: 'object', additionalProperties: true }
              },
              required: ['action', 'positionIds']
            }
          }
        }
      },
      responses: {
        '200': { description: 'Bulk action completed successfully' },
        '400': { description: 'Invalid action or input' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Insufficient permissions' }
      }
    }
  },
  '/api/v1/positions/import': {
    post: {
      summary: 'Import positions (v1 API)',
      description: 'Import positions from CSV file. Requires Bearer token authentication and Admin or POSITIONS_IMPORT permission.',
      tags: ['V1 Positions'],
      security: [{ bearerAuth: [] }],
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
        '200': { description: 'Positions imported successfully' },
        '400': { description: 'Invalid file format' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Insufficient permissions' }
      }
    }
  },
  '/api/v1/positions/export': {
    get: {
      summary: 'Export positions (v1 API)',
      description: 'Export positions to CSV file. Requires Bearer token authentication.',
      tags: ['V1 Positions'],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Positions exported successfully',
          content: {
            'text/csv': {
              schema: { type: 'string', format: 'binary' }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};
