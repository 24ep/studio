// Users API paths for Swagger documentation

export const usersPaths = {
  '/api/v1/users': {
    get: {
      summary: 'Get all users (v1 API)',
      description: 'Returns a paginated list of users. Requires Bearer token authentication.',
      tags: ['V1 Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', description: 'Page number for pagination', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', description: 'Number of items per page', schema: { type: 'integer', default: 10 } },
        { name: 'role', in: 'query', description: 'Filter by user role', schema: { type: 'string' } },
        { name: 'search', in: 'query', description: 'Search term for name or email', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'List of users',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  limit: { type: 'integer' }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    },
    post: {
      summary: 'Create a new user (v1 API)',
      description: 'Creates a new user. Requires Bearer token authentication and Admin role.',
      tags: ['V1 Users'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
                role: { type: 'string' },
                modulePermissions: { type: 'array', items: { type: 'string' } }
              },
              required: ['email', 'password', 'role']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'User created successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Insufficient permissions' }
      }
    }
  },
  '/api/v1/users/{id}': {
    get: {
      summary: 'Get user by ID (v1 API)',
      description: 'Returns details for a specific user. Requires Bearer token authentication.',
      tags: ['V1 Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'User ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'User details',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'User not found' }
      }
    },
    put: {
      summary: 'Update user by ID (v1 API)',
      description: 'Updates a user. Requires Bearer token authentication.',
      tags: ['V1 Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'User ID', schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                role: { type: 'string' },
                modulePermissions: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'User updated successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'User not found' }
      }
    },
    delete: {
      summary: 'Delete user by ID (v1 API)',
      description: 'Deletes a user. Requires Bearer token authentication and Admin role.',
      tags: ['V1 Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'User ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'User deleted successfully' },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Insufficient permissions' },
        '404': { description: 'User not found' }
      }
    }
  }
};
