// Comprehensive OpenAPI 3.0 specification for Studio API
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Studio API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for the Studio recruitment management system',
    contact: {
      name: 'Studio API Support',
      email: 'support@studio.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    { 
      url: 'http://localhost:9846',
      description: 'Development server'
    },
    { 
      url: 'https://api.studio.com',
      description: 'Production server'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  paths: {
    '/api/v1/auth/login': {
      post: {
        summary: 'External API login',
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
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string', format: 'email' },
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
          { name: 'position_level', in: 'query', description: 'Filter by position level', schema: { type: 'string' } },
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
                  isOpen: { type: 'boolean' },
                  position_level: { type: 'string', nullable: true },
                  custom_attributes: { type: 'object', additionalProperties: true, nullable: true }
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
        description: 'Updates a position. Requires Bearer token authentication and Admin or POSITIONS_MANAGE permission.',
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
                  isOpen: { type: 'boolean' },
                  position_level: { type: 'string', nullable: true },
                  custom_attributes: { type: 'object', additionalProperties: true, nullable: true }
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
        description: 'Deletes a position. Requires Bearer token authentication and Admin or POSITIONS_MANAGE permission.',
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
    '/api/v1/candidates': {
      get: {
        summary: 'Get all candidates (v1 API)',
        description: 'Returns a paginated list of candidates. Requires Bearer token authentication.',
        tags: ['V1 Candidates'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', description: 'Page number for pagination', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', description: 'Number of items per page', schema: { type: 'integer', default: 10 } },
          { name: 'status', in: 'query', description: 'Filter by candidate status', schema: { type: 'string' } },
          { name: 'positionId', in: 'query', description: 'Filter by position ID', schema: { type: 'string' } },
          { name: 'recruiterId', in: 'query', description: 'Filter by recruiter ID', schema: { type: 'string' } },
          { name: 'searchTerm', in: 'query', description: 'Search term for name or email', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'List of candidates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    candidates: { type: 'array', items: { $ref: '#/components/schemas/Candidate' } },
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
        summary: 'Create a new candidate (v1 API)',
        description: 'Creates a new candidate. Requires Bearer token authentication.',
        tags: ['V1 Candidates'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Candidate' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Candidate created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    candidate: { $ref: '#/components/schemas/Candidate' }
                  }
                }
              }
            }
          },
          '400': { description: 'Invalid input data' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Insufficient permissions' },
          '409': { description: 'Candidate with this email already exists' }
        }
      }
    },
    '/api/v1/candidates/{id}': {
      get: {
        summary: 'Get candidate by ID (v1 API)',
        description: 'Returns details for a specific candidate. Requires Bearer token authentication.',
        tags: ['V1 Candidates'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Candidate ID', schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Candidate details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Candidate' } } }
          },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Candidate not found' }
        }
      },
      put: {
        summary: 'Update candidate by ID (v1 API)',
        description: 'Updates a candidate. Requires Bearer token authentication and Admin or CANDIDATES_MANAGE permission.',
        tags: ['V1 Candidates'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Candidate ID', schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Candidate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Candidate updated successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Candidate' } } }
          },
          '400': { description: 'Invalid input data' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Insufficient permissions' },
          '404': { description: 'Candidate not found' }
        }
      },
      delete: {
        summary: 'Delete candidate by ID (v1 API)',
        description: 'Deletes a candidate. Requires Bearer token authentication and Admin or CANDIDATES_MANAGE permission.',
        tags: ['V1 Candidates'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, description: 'Candidate ID', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'Candidate deleted successfully' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Insufficient permissions' },
          '404': { description: 'Candidate not found' }
        }
      }
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from NextAuth.js'
      }
    },
    schemas: {
      Candidate: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', nullable: true },
          positionId: { type: 'string', format: 'uuid', nullable: true },
          recruiterId: { type: 'string', format: 'uuid', nullable: true },
          fitScore: { type: 'number', minimum: 0, maximum: 100 },
          status: { type: 'string' },
          parsedData: { type: 'object', additionalProperties: true, nullable: true },
          custom_attributes: { type: 'object', additionalProperties: true, nullable: true },
          resumePath: { type: 'string', nullable: true },
          applicationDate: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          positionTitle: { type: 'string', nullable: true },
          recruiterName: { type: 'string', nullable: true }
        },
        required: ['name', 'email', 'status']
      },
      CandidateUpdate: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', nullable: true },
          positionId: { type: 'string', format: 'uuid', nullable: true },
          recruiterId: { type: 'string', format: 'uuid', nullable: true },
          fitScore: { type: 'number', minimum: 0, maximum: 100 },
          status: { type: 'string', minLength: 1 },
          parsedData: { type: 'object', additionalProperties: true, nullable: true },
          custom_attributes: { type: 'object', additionalProperties: true, nullable: true },
          resumePath: { type: 'string', nullable: true }
        }
      },
      Position: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          department: { type: 'string' },
          description: { type: 'string', nullable: true },
          isOpen: { type: 'boolean' },
          position_level: { type: 'string', nullable: true },
          custom_attributes: { type: 'object', additionalProperties: true, nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['title', 'department', 'isOpen']
      },
      PositionCreate: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          department: { type: 'string', minLength: 1 },
          description: { type: 'string', nullable: true },
          isOpen: { type: 'boolean' },
          position_level: { type: 'string', nullable: true },
          custom_attributes: { type: 'object', additionalProperties: true, nullable: true }
        },
        required: ['title', 'department', 'isOpen']
      },
      PositionUpdate: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          department: { type: 'string', minLength: 1 },
          description: { type: 'string', nullable: true },
          isOpen: { type: 'boolean' },
          position_level: { type: 'string', nullable: true },
          custom_attributes: { type: 'object', additionalProperties: true, nullable: true }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['Admin', 'Recruiter', 'Manager'] },
          modulePermissions: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['name', 'email', 'role']
      },
      UserCreate: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          role: { type: 'string', enum: ['Admin', 'Recruiter', 'Manager'] },
          modulePermissions: { type: 'array', items: { type: 'string' } }
        },
        required: ['name', 'email', 'password', 'role']
      },
      UserUpdate: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['Admin', 'Recruiter', 'Manager'] },
          modulePermissions: { type: 'array', items: { type: 'string' } }
        }
      },
      RecruitmentStage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          is_system: { type: 'boolean' },
          sort_order: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['name', 'is_system', 'sort_order']
      },
      RecruitmentStageCreate: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string', nullable: true },
          sort_order: { type: 'integer', default: 0 }
        },
        required: ['name']
      },
      RecruitmentStageUpdate: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string', nullable: true },
          sort_order: { type: 'integer' }
        }
      },
      CustomFieldDefinition: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          model_name: { type: 'string' },
          field_key: { type: 'string' },
          label: { type: 'string' },
          field_type: { type: 'string', enum: ['text', 'number', 'boolean', 'select', 'date'] },
          options: { type: 'object', additionalProperties: true, nullable: true },
          is_required: { type: 'boolean' },
          sort_order: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['model_name', 'field_key', 'label', 'field_type', 'is_required', 'sort_order']
      },
      CustomFieldDefinitionCreate: {
        type: 'object',
        properties: {
          model_name: { type: 'string' },
          field_key: { type: 'string' },
          label: { type: 'string' },
          field_type: { type: 'string', enum: ['text', 'number', 'boolean', 'select', 'date'] },
          options: { type: 'object', additionalProperties: true, nullable: true },
          is_required: { type: 'boolean' },
          sort_order: { type: 'integer' }
        },
        required: ['model_name', 'field_key', 'label', 'field_type', 'is_required', 'sort_order']
      },
      UploadQueueItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          file_name: { type: 'string' },
          file_size: { type: 'integer' },
          status: { type: 'string', enum: ['queued', 'processing', 'completed', 'failed'] },
          source: { type: 'string' },
          upload_id: { type: 'string', format: 'uuid' },
          created_by: { type: 'string', format: 'uuid' },
          upload_date: { type: 'string', format: 'date-time' }
        }
      },
      UploadQueueCreate: {
        type: 'object',
        properties: {
          file_name: { type: 'string' },
          file_size: { type: 'integer' },
          status: { type: 'string', enum: ['queued', 'processing', 'completed', 'failed'] },
          source: { type: 'string' },
          upload_id: { type: 'string', format: 'uuid' },
          file_path: { type: 'string' },
          webhook_payload: { type: 'object', additionalProperties: true }
        },
        required: ['file_name', 'file_size', 'status', 'source', 'upload_id', 'file_path']
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string', enum: ['info', 'warning', 'error', 'success'] },
          isRead: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      LogEntry: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          level: { type: 'string', enum: ['INFO', 'WARN', 'ERROR', 'AUDIT'] },
          message: { type: 'string' },
          module: { type: 'string' },
          userId: { type: 'string', format: 'uuid', nullable: true },
          metadata: { type: 'object', additionalProperties: true, nullable: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      WebhookFieldMapping: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          targetPath: { type: 'string' },
          sourcePath: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['targetPath']
      },
      WebhookFieldMappingCreate: {
        type: 'object',
        properties: {
          targetPath: { type: 'string', minLength: 1 },
          sourcePath: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true }
        },
        required: ['targetPath']
      },
      UserGroup: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['name']
      },
      UserGroupCreate: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string', nullable: true }
        },
        required: ['name']
      },
      UserGroupUpdate: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string', nullable: true }
        }
      },
      SystemSettings: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          value: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['name', 'value']
      },
      SystemSettingsUpdate: {
        type: 'object',
        properties: {
          value: { type: 'string' }
        },
        required: ['value']
      },
      UserPreferences: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          value: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['userId', 'name', 'value']
      },
      UserPreferencesUpdate: {
        type: 'object',
        properties: {
          value: { type: 'string' }
        },
        required: ['value']
      },
      NotificationSettings: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          value: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['userId', 'name', 'value']
      },
      NotificationSettingsUpdate: {
        type: 'object',
        properties: {
          value: { type: 'string' }
        },
        required: ['value']
      },
      TransitionRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          candidateId: { type: 'string', format: 'uuid' },
          positionId: { type: 'string', format: 'uuid' },
          status: { type: 'string' },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['candidateId', 'positionId', 'status']
      },
      CandidateCreateWithMatches: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', nullable: true },
          positionId: { type: 'string', format: 'uuid', nullable: true },
          recruiterId: { type: 'string', format: 'uuid', nullable: true },
          fitScore: { type: 'number', minimum: 0, maximum: 100 },
          status: { type: 'string' },
          parsedData: { type: 'object', additionalProperties: true, nullable: true },
          custom_attributes: { type: 'object', additionalProperties: true, nullable: true },
          resumePath: { type: 'string', nullable: true }
        },
        required: ['name', 'email', 'status']
      },
      JobMatch: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          jobId: { type: 'string', format: 'uuid' },
          matchScore: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['jobId', 'matchScore']
      }
    }
  },
  tags: [
    { name: 'V1 Authentication', description: 'External API authentication endpoints' },
    { name: 'V1 Positions', description: 'External API for positions' },
    { name: 'V1 Candidates', description: 'External API for candidates' }
  ]
};

export default swaggerSpec; 