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
    '/api/auth/[...nextauth]': {
      get: {
        summary: 'Get current session',
        description: 'Returns the current authenticated session if available',
        tags: ['Authentication'],
        responses: {
          '200': {
            description: 'Session data or null if not authenticated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    expires: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Not authenticated'
          }
        }
      },
      post: {
        summary: 'User login or signout',
        description: 'Login (with credentials or OAuth) or signout (with provider-specific body)',
        tags: ['Authentication'],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                  provider: { type: 'string', enum: ['credentials', 'azure-ad'] }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login or signout successful'
          },
          '401': {
            description: 'Invalid credentials'
          }
        }
      }
    },
    '/api/auth/change-password': {
      post: {
        summary: 'Change user password',
        description: 'Changes the password for the authenticated user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 }
                },
                required: ['currentPassword', 'newPassword']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Password changed successfully'
          },
          '400': {
            description: 'Invalid password'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },

    // Candidates endpoints
    '/api/candidates': {
      get: {
        summary: 'Get all candidates',
        description: 'Returns a paginated list of candidates with optional filtering',
        tags: ['Candidates'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number for pagination',
            schema: { type: 'integer', default: 1, minimum: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by candidate status',
            schema: { type: 'string' }
          },
          {
            name: 'positionId',
            in: 'query',
            description: 'Filter by position ID',
            schema: { type: 'string', format: 'uuid' }
          },
          {
            name: 'searchTerm',
            in: 'query',
            description: 'Search term for name or email',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'List of candidates',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    candidates: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Candidate' }
                    },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      post: {
        summary: 'Create a new candidate',
        description: 'Creates a new candidate with the provided information',
        tags: ['Candidates'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
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
                },
                required: ['name', 'email', 'status']
              }
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
          '400': {
            description: 'Invalid input data'
          },
          '401': {
            description: 'Unauthorized'
          },
          '409': {
            description: 'Candidate with this email already exists'
          }
        }
      }
    },
    '/api/candidates/{id}': {
      get: {
        summary: 'Get candidate by ID',
        description: 'Returns a specific candidate by their ID',
        tags: ['Candidates'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Candidate ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Candidate details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Candidate' }
              }
            }
          },
          '404': {
            description: 'Candidate not found'
          }
        }
      },
      put: {
        summary: 'Update candidate',
        description: 'Updates an existing candidate',
        tags: ['Candidates'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Candidate ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CandidateUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Candidate updated successfully'
          },
          '404': {
            description: 'Candidate not found'
          }
        }
      },
      delete: {
        summary: 'Delete candidate',
        description: 'Deletes a candidate',
        tags: ['Candidates'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Candidate ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Candidate deleted successfully'
          },
          '404': {
            description: 'Candidate not found'
          }
        }
      }
    },
    '/api/candidates/bulk-action': {
      post: {
        summary: 'Bulk actions on candidates',
        description: 'Perform bulk actions on multiple candidates',
        tags: ['Candidates'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: { type: 'string', enum: ['delete', 'update_status', 'assign_recruiter'] },
                  candidateIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' }
                  },
                  data: { type: 'object', additionalProperties: true }
                },
                required: ['action', 'candidateIds']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Bulk action completed successfully'
          },
          '400': {
            description: 'Invalid action or data'
          }
        }
      }
    },
    '/api/candidates/export': {
      get: {
        summary: 'Export candidates',
        description: 'Export candidates to CSV or Excel format',
        tags: ['Candidates'],
        parameters: [
          {
            name: 'format',
            in: 'query',
            description: 'Export format',
            schema: { type: 'string', enum: ['csv', 'excel'], default: 'csv' }
          },
          {
            name: 'filters',
            in: 'query',
            description: 'JSON string of filters to apply',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Export file',
            content: {
              'text/csv': {
                schema: { type: 'string' }
              },
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: { type: 'string', format: 'binary' }
              }
            }
          }
        }
      }
    },
    '/api/candidates/import': {
      post: {
        summary: 'Import candidates',
        description: 'Import candidates from CSV or Excel file',
        tags: ['Candidates'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary'
                  },
                  mapping: {
                    type: 'object',
                    additionalProperties: true
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Import completed successfully'
          },
          '400': {
            description: 'Invalid file format or data'
          }
        }
      }
    },

    // Positions endpoints
    '/api/positions': {
      get: {
        summary: 'Get all positions',
        description: 'Returns a paginated list of positions with optional filtering',
        tags: ['Positions'],
        parameters: [
          {
            name: 'title',
            in: 'query',
            description: 'Filter by position title',
            schema: { type: 'string' }
          },
          {
            name: 'department',
            in: 'query',
            description: 'Filter by department (comma-separated)',
            schema: { type: 'string' }
          },
          {
            name: 'isOpen',
            in: 'query',
            description: 'Filter by open status',
            schema: { type: 'boolean' }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', default: 20 }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Offset for pagination',
            schema: { type: 'integer', default: 0 }
          }
        ],
        responses: {
          '200': {
            description: 'List of positions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Position' }
                    },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create a new position',
        description: 'Creates a new position',
        tags: ['Positions'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PositionCreate' }
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
          '400': {
            description: 'Invalid input data'
          },
          '403': {
            description: 'Insufficient permissions'
          }
        }
      }
    },
    '/api/positions/{id}': {
      get: {
        summary: 'Get position by ID',
        description: 'Returns a specific position by ID',
        tags: ['Positions'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Position ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Position details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Position' }
              }
            }
          },
          '404': {
            description: 'Position not found'
          }
        }
      },
      put: {
        summary: 'Update position',
        description: 'Updates an existing position',
        tags: ['Positions'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Position ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PositionUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Position updated successfully'
          },
          '404': {
            description: 'Position not found'
          }
        }
      },
      delete: {
        summary: 'Delete position',
        description: 'Deletes a position',
        tags: ['Positions'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Position ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Position deleted successfully'
          },
          '404': {
            description: 'Position not found'
          }
        }
      }
    },
    '/api/positions/bulk-action': {
      post: {
        summary: 'Bulk actions on positions',
        description: 'Perform bulk actions on multiple positions',
        tags: ['Positions'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: { type: 'string', enum: ['delete', 'update_status'] },
                  positionIds: {
                    type: 'array',
                    items: { type: 'string', format: 'uuid' }
                  },
                  data: { type: 'object', additionalProperties: true }
                },
                required: ['action', 'positionIds']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Bulk action completed successfully'
          },
          '400': {
            description: 'Invalid action or data'
          }
        }
      }
    },
    '/api/positions/export': {
      get: {
        summary: 'Export positions',
        description: 'Export positions to CSV or Excel format',
        tags: ['Positions'],
        parameters: [
          {
            name: 'format',
            in: 'query',
            description: 'Export format',
            schema: { type: 'string', enum: ['csv', 'excel'], default: 'csv' }
          }
        ],
        responses: {
          '200': {
            description: 'Export file',
            content: {
              'text/csv': {
                schema: { type: 'string' }
              },
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                schema: { type: 'string', format: 'binary' }
              }
            }
          }
        }
      }
    },
    '/api/positions/import': {
      post: {
        summary: 'Import positions',
        description: 'Import positions from CSV or Excel file',
        tags: ['Positions'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary'
                  },
                  mapping: {
                    type: 'object',
                    additionalProperties: true
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Import completed successfully'
          },
          '400': {
            description: 'Invalid file format or data'
          }
        }
      }
    },

    // Users endpoints
    '/api/users': {
      get: {
        summary: 'Get all users',
        description: 'Returns a list of all users',
        tags: ['Users'],
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      post: {
        summary: 'Create a new user',
        description: 'Creates a new user account',
        tags: ['Users'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserCreate' }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully'
          },
          '400': {
            description: 'Invalid input data'
          },
          '409': {
            description: 'User with this email already exists'
          }
        }
      }
    },
    '/api/users/{id}': {
      get: {
        summary: 'Get user by ID',
        description: 'Returns a specific user by ID',
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' }
              }
            }
          },
          '404': {
            description: 'User not found'
          }
        }
      },
      put: {
        summary: 'Update user',
        description: 'Updates an existing user',
        tags: ['Users'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'User updated successfully'
          },
          '404': {
            description: 'User not found'
          }
        }
      }
    },

    // AI endpoints
    '/api/ai/search-candidates': {
      post: {
        summary: 'AI-powered candidate search',
        description: 'Search candidates using AI with natural language queries',
        tags: ['AI'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  query: { type: 'string', minLength: 1 }
                },
                required: ['query']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    candidates: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Candidate' }
                    },
                    explanation: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Invalid query'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },

    // Settings endpoints
    '/api/settings/recruitment-stages': {
      get: {
        summary: 'Get recruitment stages',
        description: 'Returns all recruitment stages',
        tags: ['Settings'],
        responses: {
          '200': {
            description: 'List of recruitment stages',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/RecruitmentStage' }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      post: {
        summary: 'Create recruitment stage',
        description: 'Creates a new recruitment stage',
        tags: ['Settings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecruitmentStageCreate' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Recruitment stage created successfully'
          },
          '400': {
            description: 'Invalid input data'
          },
          '401': {
            description: 'Unauthorized'
          },
          '403': {
            description: 'Insufficient permissions'
          }
        }
      }
    },
    '/api/settings/recruitment-stages/{id}': {
      get: {
        summary: 'Get recruitment stage by ID',
        description: 'Returns a specific recruitment stage',
        tags: ['Settings'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Recruitment stage ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Recruitment stage details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RecruitmentStage' }
              }
            }
          },
          '404': {
            description: 'Recruitment stage not found'
          }
        }
      },
      put: {
        summary: 'Update recruitment stage',
        description: 'Updates an existing recruitment stage',
        tags: ['Settings'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Recruitment stage ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RecruitmentStageUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Recruitment stage updated successfully'
          },
          '404': {
            description: 'Recruitment stage not found'
          }
        }
      },
      delete: {
        summary: 'Delete recruitment stage',
        description: 'Deletes a recruitment stage',
        tags: ['Settings'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Recruitment stage ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Recruitment stage deleted successfully'
          },
          '404': {
            description: 'Recruitment stage not found'
          }
        }
      }
    },
    '/api/settings/custom-field-definitions': {
      get: {
        summary: 'Get custom field definitions',
        description: 'Returns all custom field definitions',
        tags: ['Settings'],
        responses: {
          '200': {
            description: 'List of custom field definitions',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CustomFieldDefinition' }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create custom field definition',
        description: 'Creates a new custom field definition',
        tags: ['Settings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CustomFieldDefinitionCreate' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Custom field definition created successfully'
          },
          '400': {
            description: 'Invalid input data'
          }
        }
      }
    },
    '/api/settings/webhook-mappings': {
      get: {
        summary: 'Get webhook field mappings',
        description: 'Returns all webhook field mappings. Requires Admin or WEBHOOK_MAPPING_MANAGE permission.',
        tags: ['Settings'],
        responses: {
          '200': {
            description: 'List of webhook field mappings',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/WebhookFieldMapping' }
                }
              }
            }
          },
          '403': {
            description: 'Forbidden (insufficient permissions)'
          },
          '500': {
            description: 'Server error'
          }
        }
      },
      post: {
        summary: 'Update webhook field mappings',
        description: 'Updates webhook field mappings. Requires Admin or WEBHOOK_MAPPING_MANAGE permission.',
        tags: ['Settings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/WebhookFieldMappingCreate' }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Updated webhook field mappings',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/WebhookFieldMapping' }
                }
              }
            }
          },
          '400': {
            description: 'Invalid input'
          },
          '403': {
            description: 'Forbidden (insufficient permissions)'
          },
          '500': {
            description: 'Server error'
          }
        }
      }
    },
    '/api/settings/user-groups': {
      get: {
        summary: 'Get user groups',
        description: 'Returns all user groups',
        tags: ['Settings'],
        responses: {
          '200': {
            description: 'List of user groups',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserGroup' }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      post: {
        summary: 'Create user group',
        description: 'Creates a new user group',
        tags: ['Settings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserGroupCreate' }
            }
          }
        },
        responses: {
          '201': {
            description: 'User group created successfully'
          },
          '400': {
            description: 'Invalid input data'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/api/settings/user-groups/{id}': {
      get: {
        summary: 'Get user group by ID',
        description: 'Returns a specific user group',
        tags: ['Settings'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User group ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'User group details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserGroup' }
              }
            }
          },
          '404': {
            description: 'User group not found'
          }
        }
      },
      put: {
        summary: 'Update user group',
        description: 'Updates an existing user group',
        tags: ['Settings'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User group ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserGroupUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'User group updated successfully'
          },
          '404': {
            description: 'User group not found'
          }
        }
      },
      delete: {
        summary: 'Delete user group',
        description: 'Deletes a user group',
        tags: ['Settings'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'User group ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'User group deleted successfully'
          },
          '404': {
            description: 'User group not found'
          }
        }
      }
    },
    '/api/settings/system-settings': {
      get: {
        summary: 'Get system settings',
        description: 'Returns system settings',
        tags: ['Settings'],
        responses: {
          '200': {
            description: 'System settings',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SystemSettings' }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      post: {
        summary: 'Update system settings',
        description: 'Updates system settings',
        tags: ['Settings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SystemSettingsUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'System settings updated successfully'
          },
          '400': {
            description: 'Invalid input data'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/api/settings/system-preferences': {
      get: {
        summary: 'Get global system preferences',
        description: 'Returns global system preferences for branding and theme. Requires authentication.',
        tags: ['Settings'],
        responses: {
          '200': {
            description: 'System preferences',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    appName: { type: 'string', description: 'Application name' },
                    themePreference: { type: 'string', enum: ['light', 'dark', 'system'], description: 'Theme preference' },
                    appLogoDataUrl: { type: 'string', nullable: true, description: 'Base64-encoded logo image data URL' },
                  },
                  example: {
                    appName: 'CandiTrack',
                    themePreference: 'system',
                    appLogoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...'
                  }
                }
              }
            }
          },
          '401': { description: 'Unauthorized' },
          '500': { description: 'Server error' }
        }
      },
      post: {
        summary: 'Update global system preferences',
        description: 'Updates global system preferences (branding, theme, logo). Requires Admin or SYSTEM_SETTINGS_MANAGE permission.',
        tags: ['Settings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  appName: { type: 'string', description: 'Application name' },
                  themePreference: { type: 'string', enum: ['light', 'dark', 'system'], description: 'Theme preference' },
                  appLogoDataUrl: { type: 'string', nullable: true, description: 'Base64-encoded logo image data URL' },
                },
                required: ['appName', 'themePreference']
              },
              example: {
                appName: 'CandiTrack',
                themePreference: 'dark',
                appLogoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'System preferences updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' }
                  },
                  example: { message: 'System preferences updated' }
                }
              }
            }
          },
          '400': { description: 'Invalid input' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden: Insufficient permissions' },
          '500': { description: 'Server error' }
        }
      }
    },
    '/api/settings/user-preferences': {
      get: {
        summary: 'Get user preferences',
        description: 'Returns user preferences for the authenticated user',
        tags: ['Settings'],
        responses: {
          '200': {
            description: 'User preferences',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserPreferences' }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      post: {
        summary: 'Update user preferences',
        description: 'Updates user preferences for the authenticated user',
        tags: ['Settings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UserPreferencesUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'User preferences updated successfully'
          },
          '400': {
            description: 'Invalid input data'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/api/settings/notifications': {
      get: {
        summary: 'Get notification settings',
        description: 'Returns notification settings',
        tags: ['Settings'],
        responses: {
          '200': {
            description: 'Notification settings',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotificationSettings' }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      post: {
        summary: 'Update notification settings',
        description: 'Updates notification settings',
        tags: ['Settings'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotificationSettingsUpdate' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Notification settings updated successfully'
          },
          '400': {
            description: 'Invalid input data'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },

    // Transitions endpoints
    '/api/transitions/{id}': {
      put: {
        summary: 'Update transition record',
        description: 'Updates a transition record with notes',
        tags: ['Transitions'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Transition record ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  notes: { type: 'string', nullable: true }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Transition record updated successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TransitionRecord' }
              }
            }
          },
          '400': {
            description: 'Invalid input data'
          },
          '403': {
            description: 'Forbidden'
          },
          '404': {
            description: 'Transition record not found'
          }
        }
      },
      delete: {
        summary: 'Delete transition record',
        description: 'Deletes a transition record',
        tags: ['Transitions'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Transition record ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Transition record deleted successfully'
          },
          '403': {
            description: 'Forbidden'
          },
          '404': {
            description: 'Transition record not found'
          }
        }
      }
    },

    // Automation Integration endpoints
    '/api/automation/create-candidate-with-matches': {
      get: {
        summary: 'Health check for automation integration',
        description: 'Returns a simple health check response',
        tags: ['Automation Integration'],
        responses: {
          '200': {
            description: 'Health check response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Create candidate with job matches',
        description: 'Creates a new candidate with associated job matches from automation workflow',
        tags: ['Automation Integration'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  candidate: { $ref: '#/components/schemas/CandidateCreateWithMatches' },
                  job_matches: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/JobMatch' }
                  }
                },
                required: ['candidate']
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Candidate and matches created successfully',
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
          '400': {
            description: 'Invalid input data'
          },
          '409': {
            description: 'Candidate with this email already exists'
          },
          '500': {
            description: 'Server error'
          }
        }
      }
    },
    '/api/automation/webhook-proxy': {
      post: {
        summary: 'Automation webhook proxy',
        description: 'Proxies webhook requests from automation workflows',
        tags: ['Automation Integration'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: true
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Webhook processed successfully'
          },
          '400': {
            description: 'Invalid webhook data'
          }
        }
      }
    },

    // Upload endpoints
    '/api/upload-queue': {
      get: {
        summary: 'Get upload queue',
        description: 'Returns a paginated list of upload queue jobs',
        tags: ['Upload'],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', default: 20 }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Offset for pagination',
            schema: { type: 'integer', default: 0 }
          }
        ],
        responses: {
          '200': {
            description: 'Paginated upload queue',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/UploadQueueItem' }
                    },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      },
      post: {
        summary: 'Add to upload queue',
        description: 'Adds a new file to the upload queue',
        tags: ['Upload'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UploadQueueCreate' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Upload queue item created successfully'
          },
          '400': {
            description: 'Invalid input data'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/api/resumes/upload': {
      post: {
        summary: 'Upload resume',
        description: 'Uploads a resume file for a candidate',
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
                    format: 'binary'
                  },
                  candidateId: {
                    type: 'string',
                    format: 'uuid'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Resume uploaded successfully'
          },
          '400': {
            description: 'Invalid file or data'
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },

    // Realtime endpoints
    '/api/realtime/notifications': {
      get: {
        summary: 'Get notifications',
        description: 'Returns notifications for the authenticated user',
        tags: ['Realtime'],
        responses: {
          '200': {
            description: 'List of notifications',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Notification' }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },
    '/api/realtime/notifications/{id}/read': {
      post: {
        summary: 'Mark notification as read',
        description: 'Marks a notification as read',
        tags: ['Realtime'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Notification ID',
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          '200': {
            description: 'Notification marked as read'
          },
          '404': {
            description: 'Notification not found'
          }
        }
      }
    },

    // Logs endpoints
    '/api/logs': {
      get: {
        summary: 'Get system logs',
        description: 'Returns system logs with optional filtering',
        tags: ['Logs'],
        parameters: [
          {
            name: 'level',
            in: 'query',
            description: 'Filter by log level',
            schema: { type: 'string', enum: ['INFO', 'WARN', 'ERROR', 'AUDIT'] }
          },
          {
            name: 'module',
            in: 'query',
            description: 'Filter by module',
            schema: { type: 'string' }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Number of items per page',
            schema: { type: 'integer', default: 50 }
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Offset for pagination',
            schema: { type: 'integer', default: 0 }
          }
        ],
        responses: {
          '200': {
            description: 'List of logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    logs: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/LogEntry' }
                    },
                    total: { type: 'integer' }
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized'
          }
        }
      }
    },

    // Setup endpoints
    '/api/setup/check-minio-bucket': {
      get: {
        summary: 'Check MinIO bucket',
        description: 'Checks if the MinIO bucket is properly configured',
        tags: ['Setup'],
        responses: {
          '200': {
            description: 'MinIO bucket status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'bucket_missing', 'connection_error'] },
                    details: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/setup/initialize': {
      get: {
        summary: 'Check application status',
        description: 'Checks the status of all application services (database, MinIO)',
        tags: ['Setup'],
        responses: {
          '200': {
            description: 'Application status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ready', 'partial', 'failed'] },
                    minio: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', enum: ['success', 'warning', 'error'] },
                        message: { type: 'string' },
                        bucket: { type: 'string' },
                        error: { type: 'string' }
                      }
                    },
                    database: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', enum: ['success', 'error'] },
                        message: { type: 'string' },
                        error: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Initialization error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    details: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: 'Initialize application services',
        description: 'Initializes MinIO bucket and tests database connection',
        tags: ['Setup'],
        responses: {
          '200': {
            description: 'Application initialization result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ready', 'partial', 'failed'] },
                    minio: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', enum: ['success', 'warning', 'error'] },
                        message: { type: 'string' },
                        bucket: { type: 'string' },
                        error: { type: 'string' }
                      }
                    },
                    database: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', enum: ['success', 'error'] },
                        message: { type: 'string' },
                        error: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          },
          '500': {
            description: 'Initialization error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                    details: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
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
          created_by: { type: 'string', format: 'uuid' }
        },
        required: ['file_name', 'file_size', 'status', 'source', 'upload_id', 'created_by']
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
    {
      name: 'Authentication',
      description: 'Authentication and authorization endpoints'
    },
    {
      name: 'Candidates',
      description: 'Candidate management endpoints'
    },
    {
      name: 'Positions',
      description: 'Position management endpoints'
    },
    {
      name: 'Users',
      description: 'User management endpoints'
    },
    {
      name: 'AI',
      description: 'AI-powered features endpoints'
    },
    {
      name: 'Settings',
      description: 'System settings and configuration endpoints'
    },
    {
      name: 'Upload',
      description: 'File upload and queue management endpoints'
    },
    {
      name: 'Realtime',
      description: 'Real-time features and notifications endpoints'
    },
    {
      name: 'Logs',
      description: 'System logging and audit endpoints'
    },
    {
      name: 'Setup',
      description: 'System setup and health check endpoints'
    },
    {
      name: 'Transitions',
      description: 'Candidate transition and status change endpoints'
    },
    {
      name: 'Automation Integration',
      description: 'Automation workflow integration endpoints'
    }
  ]
};

export default swaggerSpec; 