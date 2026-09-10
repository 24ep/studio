// Comprehensive OpenAPI 3.0 specification for hrive API
// This file contains all API endpoints in a single location for better reliability

export function getSwaggerSpec() {
  // Use production server URL for Swagger API testing
  const serverUrl = process.env.PRODUCTION_HOST || process.env.API_BASE_URL || 'http://8021_hri_app:8021';
  return {
    openapi: '3.0.0',
    info: {
      title: 'hrive API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Studio recruitment management system',
      contact: {
        name: 'hrive API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: serverUrl,
        description: 'hrive API Server',
      },
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
            '200': { description: 'Position created successfully' },
            '400': { description: 'Invalid input' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/positions/{id}': {
        get: {
          summary: 'Get position by ID (v1 API)',
          description: 'Returns a specific position by ID. Requires Bearer token authentication.',
          tags: ['V1 Positions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: 'Position ID', schema: { type: 'string' } }
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
            '404': { description: 'Position not found' },
            '401': { description: 'Unauthorized' }
          }
        },
        put: {
          summary: 'Update position (v1 API)',
          description: 'Updates an existing position. Requires Bearer token authentication.',
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
            '200': { description: 'Position updated successfully' },
            '400': { description: 'Invalid input' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'Position not found' }
          }
        },
        delete: {
          summary: 'Delete position (v1 API)',
          description: 'Deletes a position. Requires Bearer token authentication.',
          tags: ['V1 Positions'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: 'Position ID', schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Position deleted successfully' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'Position not found' }
          }
        }
      },
      '/api/v1/Applicants': {
        get: {
          summary: 'Get all Applicants (v1 API)',
          description: 'Returns a paginated list of Applicants. Requires Bearer token authentication.',
          tags: ['V1 Applicants'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'page', in: 'query', description: 'Page number for pagination', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', description: 'Number of items per page', schema: { type: 'integer', default: 10 } },
            { name: 'status', in: 'query', description: 'Filter by Applicant status', schema: { type: 'string' } },
            { name: 'positionId', in: 'query', description: 'Filter by position ID', schema: { type: 'string' } },
            { name: 'recruiterId', in: 'query', description: 'Filter by recruiter ID', schema: { type: 'string' } },
            { name: 'search', in: 'query', description: 'Search term for name or email', schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: 'List of Applicants',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      Applicants: { type: 'array', items: { $ref: '#/components/schemas/Applicant' } },
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
          summary: 'Create a new Applicant (v1 API)',
          description: 'Creates a new Applicant with structured education and experience data.',
          tags: ['V1 Applicants'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    applicant_info: {
                      type: 'object',
                      properties: {
                        personal_info: {
                          type: 'object',
                          properties: {
                            title_honorific: { type: 'string', nullable: true },
                            firstname: { type: 'string' },
                            lastname: { type: 'string' },
                            nickname: { type: 'string', nullable: true },
                            location: { type: 'string', nullable: true },
                            introduction_aboutme: { type: 'string', nullable: true }
                          },
                          required: ['firstname', 'lastname']
                        },
                        contact_info: {
                          type: 'object',
                          properties: {
                            email: { type: 'string', format: 'email' },
                            phone: { type: 'string', nullable: true }
                          },
                          required: ['email']
                        },
                        skills: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              segment_skill: { type: 'string' },
                              skill: { type: 'array', items: { type: 'string' } }
                            }
                          }
                        },
                        status: { type: 'string', nullable: true },
                        job_suitable: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              suitable_career: { type: 'string' },
                              suitable_job_position: { type: 'string' },
                              suitable_job_level: { type: 'string' },
                              suitable_salary_bath_month: { type: 'string' }
                            }
                          }
                        }
                      },
                      required: ['contact_info', 'personal_info']
                    },
                    educationData: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          institution: { type: 'string' },
                          degree: { type: 'string' },
                          field_of_study: { type: 'string' },
                          start_date: { type: 'string', format: 'date' },
                          end_date: { type: 'string', format: 'date', nullable: true },
                          gpa: { type: 'string', nullable: true },
                          description: { type: 'string', nullable: true }
                        }
                      }
                    },
                    experienceData: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          company: { type: 'string' },
                          position: { type: 'string' },
                          start_date: { type: 'string', format: 'date' },
                          end_date: { type: 'string', format: 'date', nullable: true },
                          description: { type: 'string', nullable: true },
                          achievements: { type: 'array', items: { type: 'string' } }
                        }
                      }
                    }
                  },
                  required: ['applicant_info']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Applicant created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      applicantId: { type: 'string' },
                      message: { type: 'string' }
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
      '/api/v1/Applicants/{id}': {
        get: {
          summary: 'Get Applicant by ID (v1 API)',
          description: 'Returns a specific Applicant by ID. Requires Bearer token authentication.',
          tags: ['V1 Applicants'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
          ],
          responses: {
            '200': {
              description: 'Applicant details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Applicant' }
                }
              }
            },
            '404': { description: 'Applicant not found' },
            '401': { description: 'Unauthorized' }
          }
        },
        put: {
          summary: 'Update Applicant (v1 API)',
          description: 'Updates an existing Applicant. Requires Bearer token authentication.',
          tags: ['V1 Applicants'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    applicant_info: { type: 'object', additionalProperties: true },
                    educationData: { type: 'array', items: { type: 'object', additionalProperties: true } },
                    experienceData: { type: 'array', items: { type: 'object', additionalProperties: true } }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Applicant updated successfully' },
            '400': { description: 'Invalid input' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'Applicant not found' }
          }
        },
        delete: {
          summary: 'Delete Applicant (v1 API)',
          description: 'Deletes a Applicant. Requires Bearer token authentication.',
          tags: ['V1 Applicants'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Applicant deleted successfully' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'Applicant not found' }
          }
        }
      },
      '/api/v1/Applicants/import': {
        post: {
          summary: 'Import Applicants (v1 API)',
          description: 'Import Applicants from CSV file. Requires Bearer token authentication.',
          tags: ['V1 Applicants'],
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
            '200': { description: 'Applicants imported successfully' },
            '400': { description: 'Invalid file format' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/applicants/bulk-upload-cv': {
        post: {
          summary: 'Upload CV with optional additional attachments (v1 API)',
          description: 'Upload a single CV file for a Applicant with optional additional attachments (e.g., cover letters, portfolios, certificates). Requires Bearer token authentication.',
          tags: ['V1 Applicants'],
          security: [{ bearerAuth: [] }],
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
                      description: 'Main CV file (PDF)'
                    },
                    positionId: {
                      type: 'string',
                      description: 'Position ID to assign the Applicant to'
                    },
                    sourceId: {
                      type: 'string',
                      description: 'Source ID for tracking the Applicant source'
                    },
                    additionalAttachments: {
                      type: 'array',
                      items: {
                        type: 'string',
                        format: 'binary'
                      },
                      description: 'Optional additional attachments (e.g., cover letters, portfolios, certificates). Can upload multiple files.'
                    }
                  },
                  required: ['file', 'positionId']
                }
              }
            }
          },
          responses: {
            '200': { 
              description: 'CV uploaded successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      uploadQueueJob: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          file_name: { type: 'string' },
                          file_size: { type: 'number' },
                          status: { type: 'string' },
                          source: { type: 'string' },
                          upload_id: { type: 'string' },
                          file_path: { type: 'string' },
                          webhook_payload: { 
                            type: 'object',
                            properties: {
                              targetPositionId: { type: 'string' },
                              sourceId: { type: 'string' },
                              additionalAttachments: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    path: { type: 'string' },
                                    name: { type: 'string' },
                                    size: { type: 'number' },
                                    type: { type: 'string' }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Invalid file or missing required parameters' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden: Insufficient permissions' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/v1/Applicants/clear-duplicates': {
        post: {
          summary: 'Clear duplicate Applicants (v1 API)',
          description: 'Remove duplicate Applicants from the system. Requires Bearer token authentication.',
          tags: ['V1 Applicants'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Duplicates cleared successfully' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/Applicants/bulk-action': {
        post: {
          summary: 'Bulk action on Applicants (v1 API)',
          description: 'Perform bulk actions on multiple Applicants. Requires Bearer token authentication.',
          tags: ['V1 Applicants'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    action: { type: 'string', enum: ['delete', 'update', 'export'] },
                    applicantIds: { type: 'array', items: { type: 'string' } },
                    updates: { type: 'object', additionalProperties: true }
                  },
                  required: ['action', 'applicantIds']
                }
              }
            }
          },
          responses: {
            '200': { description: 'Bulk action completed successfully' },
            '400': { description: 'Invalid action or input' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/users': {
        get: {
          summary: 'Get all users (v1 API)',
          description: 'Returns a list of users. Requires Bearer token authentication.',
          tags: ['V1 Users'],
          security: [{ bearerAuth: [] }],
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
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/users/{id}': {
        get: {
          summary: 'Get user by ID (v1 API)',
          description: 'Returns a specific user by ID. Requires Bearer token authentication.',
          tags: ['V1 Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, description: 'User ID', schema: { type: 'string' } }
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
            '404': { description: 'User not found' },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/dashboard/stats': {
        get: {
          summary: 'Get dashboard statistics (v1 API)',
          description: 'Returns dashboard statistics. Requires Bearer token authentication.',
          tags: ['V1 Dashboard'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Dashboard statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      totalApplicants: { type: 'integer' },
                      totalPositions: { type: 'integer' },
                      openPositions: { type: 'integer' },
                      recentApplications: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/health': {
        get: {
          summary: 'Health check (v1 API)',
          description: 'Returns system health status.',
          tags: ['V1 Health'],
          responses: {
            '200': {
              description: 'System is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/recruitment-stages': {
        get: {
          summary: 'Get recruitment stages (v1 API)',
          description: 'Returns all recruitment stages. Requires Bearer token authentication.',
          tags: ['V1 Recruitment Stages'],
          security: [{ bearerAuth: [] }],
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
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/transitions': {
        get: {
          summary: 'Get Applicant transitions (v1 API)',
          description: 'Returns Applicant stage transitions. Requires Bearer token authentication.',
          tags: ['V1 Transitions'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'List of transitions',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Transition' }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/settings': {
        get: {
          summary: 'Get system settings (v1 API)',
          description: 'Returns system settings. Requires Bearer token authentication.',
          tags: ['V1 Settings'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'System settings',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    additionalProperties: true
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/logs': {
        get: {
          summary: 'Get system logs (v1 API)',
          description: 'Returns system logs. Requires Bearer token authentication.',
          tags: ['V1 Logs'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'level', in: 'query', description: 'Log level filter', schema: { type: 'string' } },
            { name: 'limit', in: 'query', description: 'Number of logs to return', schema: { type: 'integer', default: 100 } }
          ],
          responses: {
            '200': {
              description: 'System logs',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/LogEntry' }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' }
          }
        }
      },
      '/api/v1/ai/search-Applicants': {
        post: {
          summary: 'Search Applicants using AI (V1 API)',
          description: 'Search Applicants using AI-powered semantic search. Requires Bearer token authentication.',
          tags: ['V1 AI Search'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'Search query',
                      example: 'software engineer with React experience'
                    },
                    positionId: {
                      type: 'string',
                      format: 'uuid',
                      description: 'Optional position ID to filter results',
                      example: '123e4567-e89b-12d3-a456-426614174000'
                    },
                    limit: {
                      type: 'integer',
                      default: 20,
                      minimum: 1,
                      maximum: 100,
                      description: 'Number of results to return'
                    },
                    offset: {
                      type: 'integer',
                      default: 0,
                      minimum: 0,
                      description: 'Offset for pagination'
                    }
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
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            name: { type: 'string' },
                            email: { type: 'string' },
                            phone: { type: 'string' },
                            status: { type: 'string' },
                            fitScore: { type: 'number' },
                            matchReasons: {
                              type: 'array',
                              items: { type: 'string' }
                            },
                            parsedData: { type: 'object' }
                          }
                        }
                      },
                      total: { type: 'integer', description: 'Total number of matching Applicants' },
                      query: { type: 'string', description: 'The search query used' },
                      timestamp: { type: 'string', format: 'date-time' },
                      path: { type: 'string' },
                      method: { type: 'string' },
                      statusCode: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '400': { description: 'Invalid request body' },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/v1/notifications': {
        get: {
          summary: 'Get user notifications (V1 API)',
          description: 'Retrieve notifications for the authenticated user with pagination and filtering. Requires Bearer token authentication.',
          tags: ['V1 Notifications'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', description: 'Number of notifications to return', schema: { type: 'integer', default: 50, maximum: 100 } },
            { name: 'offset', in: 'query', description: 'Offset for pagination', schema: { type: 'integer', default: 0 } },
            { name: 'isRead', in: 'query', description: 'Filter by read status', schema: { type: 'boolean' } }
          ],
          responses: {
            '200': {
              description: 'User notifications',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      notifications: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            type: { type: 'string' },
                            title: { type: 'string' },
                            message: { type: 'string' },
                            data: { type: 'object' },
                            isRead: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                          }
                        }
                      },
                      total: { type: 'integer' },
                      unreadCount: { type: 'integer' },
                      limit: { type: 'integer' },
                      offset: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Internal server error' }
          }
        },
        post: {
          summary: 'Send notifications (V1 API)',
          description: 'Send custom notifications. Supports both single and bulk notifications. Requires Bearer token authentication and applicantS_EDIT_BASIC permission or Admin role.',
          tags: ['V1 Notifications'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        type: { type: 'string', example: 'custom_notification' },
                        title: { type: 'string', example: 'Important Update' },
                        message: { type: 'string', example: 'Your account has been updated' },
                        targetUserId: { type: 'string', format: 'uuid', description: 'Optional, defaults to current user' },
                        data: { type: 'object' }
                      },
                      required: ['type', 'title', 'message']
                    },
                    {
                      type: 'object',
                      properties: {
                        notifications: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              type: { type: 'string' },
                              title: { type: 'string' },
                              message: { type: 'string' },
                              targetUserId: { type: 'string', format: 'uuid' },
                              data: { type: 'object' }
                            },
                            required: ['type', 'title', 'message', 'targetUserId']
                          }
                        }
                      },
                      required: ['notifications']
                    }
                  ]
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Notification sent successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      notification: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          type: { type: 'string' },
                          title: { type: 'string' },
                          message: { type: 'string' },
                          data: { type: 'object' },
                          isRead: { type: 'boolean' },
                          createdAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': { description: 'Invalid request body' },
            '401': { description: 'Unauthorized' },
            '403': { description: 'Forbidden - Insufficient permissions' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/v1/upload-queue': {
        get: {
          summary: 'Get upload queue (V1 API)',
          description: 'Returns a paginated list of upload queue jobs. Requires Bearer token authentication.',
          tags: ['V1 Upload Queue'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'limit', in: 'query', description: 'Number of items per page', schema: { type: 'integer', default: 20, maximum: 1000 } },
            { name: 'offset', in: 'query', description: 'Offset for pagination', schema: { type: 'integer', default: 0 } },
            { name: 'file_name', in: 'query', description: 'Filter by filename (partial match)', schema: { type: 'string' } },
            { name: 'status', in: 'query', description: 'Filter by status', schema: { type: 'string', enum: ['queued', 'inprocess', 'success', 'error', 'failed'] } },
            { name: 'date_start', in: 'query', description: 'Filter by start date (YYYY-MM-DD)', schema: { type: 'string', format: 'date' } },
            { name: 'date_end', in: 'query', description: 'Filter by end date (YYYY-MM-DD)', schema: { type: 'string', format: 'date' } },
            { name: 'position_id', in: 'query', description: 'Filter by position ID', schema: { type: 'string', format: 'uuid' } }
          ],
          responses: {
            '200': {
              description: 'Upload queue data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            file_name: { type: 'string' },
                            file_size: { type: 'integer' },
                            status: { type: 'string', enum: ['queued', 'inprocess', 'success', 'error', 'failed'] },
                            source: { type: 'string' },
                            upload_id: { type: 'string', format: 'uuid' },
                            created_by: { type: 'string', format: 'uuid' },
                            file_path: { type: 'string' },
                            created_at: { type: 'string', format: 'date-time' },
                            updated_at: { type: 'string', format: 'date-time' }
                          }
                        }
                      },
                      total: { type: 'integer' },
                      limit: { type: 'integer' },
                      offset: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/v1/Applicant-sources': {
        get: {
          summary: 'Get Applicant sources (V1 API)',
          description: 'Get all Applicant sources for filtering and display. Requires Bearer token authentication.',
          tags: ['V1 Source Management'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Applicant sources list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            email: { type: 'string' },
                            logo: { type: 'string' },
                            allowSubSource: { type: 'boolean' },
                            sortOrder: { type: 'integer' },
                            isActive: { type: 'boolean' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Internal server error' }
          }
        }
      },
      '/api/v1/job-match-status': {
        get: {
          summary: 'Check job match function status (V1 API)',
          description: 'Returns whether the job match function is enabled or disabled. Requires Bearer token authentication.',
          tags: ['V1 Job Match Status'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Job match function status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'object',
                        properties: {
                          isJobMatchEnabled: {
                            type: 'boolean',
                            description: 'Whether the job match function is enabled',
                            example: true
                          },
                          settingValue: {
                            type: 'string',
                            description: 'The raw setting value from the database',
                            example: 'true'
                          },
                          defaultBehavior: {
                            type: 'string',
                            description: 'Explanation of the default behavior',
                            example: 'Feature is enabled by default unless explicitly set to false'
                          }
                        }
                      },
                      timestamp: { type: 'string', format: 'date-time' },
                      path: { type: 'string' },
                      method: { type: 'string' },
                      statusCode: { type: 'integer' }
                    }
                  }
                }
              }
            },
            '401': { description: 'Unauthorized' },
            '500': { description: 'Internal server error' }
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
        Position: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            department: { type: 'string' },
            description: { type: 'string', nullable: true },
            isOpen: { type: 'boolean' },
            positionLevel: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        applicant: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firstname: { type: 'string' },
            lastname: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', nullable: true },
            status: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string' },
            modulePermissions: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        RecruitmentStage: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            order: { type: 'integer' },
            isActive: { type: 'boolean' }
          }
        },
        Transition: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            applicantId: { type: 'string' },
            fromStage: { type: 'string' },
            toStage: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        LogEntry: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            level: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    tags: [
      { name: 'V1 Authentication', description: 'External API authentication endpoints' },
      { name: 'V1 Positions', description: 'External API for positions' },
      { name: 'V1 Applicants', description: 'External API for Applicants' },
      { name: 'V1 Users', description: 'External API for users' },
      { name: 'V1 Dashboard', description: 'External API for dashboard statistics' },
      { name: 'V1 Health', description: 'Health check endpoints' },
      { name: 'V1 Recruitment Stages', description: 'External API for recruitment stages' },
      { name: 'V1 Transitions', description: 'External API for Applicant stage transitions' },
      { name: 'V1 Settings', description: 'External API for system settings' },
      { name: 'V1 Logs', description: 'External API for system logs' },
      { name: 'V1 AI Search', description: 'External API for AI-powered Applicant search' },
      { name: 'V1 Notifications', description: 'External API for user notifications' },
      { name: 'V1 Upload Queue', description: 'External API for upload queue management' },
      { name: 'V1 Source Management', description: 'External API for Applicant source management' },
      { name: 'V1 Job Match Status', description: 'External API for job match function status' }
    ]
  };
}

export default getSwaggerSpec();

