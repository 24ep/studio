// Authentication API paths for Swagger documentation

export const authPaths = {
  '/api/v1/auth/login': {
    post: {
      summary: 'External API login (Email/Password)',
      description: 'Authenticate with email and password to receive a JWT for API use.',
      tags: ['V1 Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' }
              },
              required: ['email', 'password']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Login successful, returns JWT token and user info',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  token: { type: 'string', description: 'JWT for Bearer authentication' },
                  tokenType: { type: 'string', example: 'JWE' },
                  expiresIn: { type: 'integer', example: 3600, description: 'Token expiration in seconds' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string', format: 'email' },
                      name: { type: 'string' },
                      role: { type: 'string' },
                      modulePermissions: { type: 'array', items: { type: 'string' } }
                    }
                  }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid input or missing fields' },
        '401': { description: 'Invalid email or password' }
      }
    }
  },
  '/api/v2/auth/login': {
    post: {
      summary: 'External API login (API Key)',
      description: `Authenticate with an API key to receive a JWT for API use. 
      
**Recommended for external integrations like n8n, Zapier, or custom scripts.**

API keys can be provided via:
- \`X-API-Key\` header (recommended)
- \`Authorization: Bearer sk_live_...\` header
- Request body: \`{ "apiKey": "sk_live_..." }\`

The response format matches v1 login for compatibility, with an additional \`isSystemUser: true\` flag.`,
      tags: ['V2 Authentication'],
      parameters: [
        {
          name: 'X-API-Key',
          in: 'header',
          description: 'API key for authentication (alternative to body)',
          required: false,
          schema: { type: 'string', example: 'sk_live_...' }
        }
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                apiKey: { type: 'string', description: 'API key (if not using header)', example: 'sk_live_...' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Login successful, returns JWT token and system user info',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  token: { type: 'string', description: 'JWT for Bearer authentication in subsequent requests' },
                  tokenType: { type: 'string', example: 'JWE' },
                  expiresIn: { type: 'integer', example: 3600, description: 'Token expiration in seconds' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', description: 'API key ID' },
                      email: { type: 'string', example: 'api-key-sk_live_...@system' },
                      name: { type: 'string', example: 'API: My Integration' },
                      role: { type: 'string', example: 'api_user' },
                      modulePermissions: { type: 'array', items: { type: 'string' } },
                      isSystemUser: { type: 'boolean', example: true, description: 'Indicates API key authentication' }
                    }
                  }
                }
              }
            }
          }
        },
        '400': { description: 'API key is required or invalid format' },
        '401': { description: 'Invalid, expired, or disabled API key' }
      }
    }
  }
};
