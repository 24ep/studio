// Applicants API paths for Swagger documentation

export const ApplicantsPaths = {
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
                  items: { $ref: '#/components/schemas/StructuredEducationEntry' }
                },
                experienceData: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/StructuredExperienceEntry' }
                }
              },
              required: ['applicant_info']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Applicant created successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Applicant' } } }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' }
      }
    }
  },
  '/api/v1/Applicants/{id}': {
    get: {
      summary: 'Get Applicant by ID (v1 API)',
      description: 'Returns details for a specific Applicant. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Applicant details',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Applicant' } } }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    },
    put: {
      summary: 'Update Applicant by ID (v1 API)',
      description: 'Updates a Applicant. Requires Bearer token authentication.',
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
                applicant_info: { type: 'object' },
                educationData: { type: 'array', items: { $ref: '#/components/schemas/StructuredEducationEntry' } },
                experienceData: { type: 'array', items: { $ref: '#/components/schemas/StructuredExperienceEntry' } }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Applicant updated successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Applicant' } } }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    },
    delete: {
      summary: 'Delete Applicant by ID (v1 API)',
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
  '/api/v1/Applicants/{id}/job-applied': {
    get: {
      summary: 'Get Applicant job applications (v1 API)',
      description: 'Returns job applications for a specific Applicant. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Job applications retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/JobApplication' }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    }
  },
  '/api/v1/Applicants/{id}/job-matches': {
    get: {
      summary: 'Get Applicant job matches (v1 API)',
      description: 'Returns job matches for a specific Applicant. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Job matches retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/JobMatch' }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    }
  },
  '/api/v1/Applicants/{id}/job-matches/add': {
    post: {
      summary: 'Add job match for Applicant (v1 API)',
      description: 'Adds a job match for a specific Applicant. Requires Bearer token authentication.',
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
                positionId: { type: 'string' },
                matchScore: { type: 'number' },
                notes: { type: 'string', nullable: true }
              },
              required: ['positionId']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Job match added successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/JobMatch' } } }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    }
  },
  '/api/v1/Applicants/{id}/job-matches/{matchId}': {
    get: {
      summary: 'Get specific job match (v1 API)',
      description: 'Returns a specific job match for a Applicant. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } },
        { name: 'matchId', in: 'path', required: true, description: 'Match ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Job match retrieved successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/JobMatch' } } }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant or match not found' }
      }
    },
    put: {
      summary: 'Update job match (v1 API)',
      description: 'Updates a specific job match. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } },
        { name: 'matchId', in: 'path', required: true, description: 'Match ID', schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                matchScore: { type: 'number' },
                notes: { type: 'string', nullable: true },
                status: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Job match updated successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/JobMatch' } } }
        },
        '400': { description: 'Invalid input data' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant or match not found' }
      }
    },
    delete: {
      summary: 'Delete job match (v1 API)',
      description: 'Deletes a specific job match. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } },
        { name: 'matchId', in: 'path', required: true, description: 'Match ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': { description: 'Job match deleted successfully' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant or match not found' }
      }
    }
  },
  '/api/v1/Applicants/{id}/attachments': {
    get: {
      summary: 'Get Applicant attachments (v1 API)',
      description: 'Returns attachments for a specific Applicant. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Attachments retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Attachment' }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    },
    post: {
      summary: 'Upload Applicant attachment (v1 API)',
      description: 'Uploads an attachment for a specific Applicant. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' },
                type: { type: 'string' },
                description: { type: 'string', nullable: true }
              },
              required: ['file']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Attachment uploaded successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Attachment' } } }
        },
        '400': { description: 'Invalid file or input' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    }
  },
  '/api/v1/Applicants/{id}/avatar': {
    post: {
      summary: 'Upload Applicant avatar (v1 API)',
      description: 'Uploads an avatar for a specific Applicant. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
      ],
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
        '200': {
          description: 'Avatar uploaded successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  avatarUrl: { type: 'string' }
                }
              }
            }
          }
        },
        '400': { description: 'Invalid file' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    }
  },
  '/api/v1/Applicants/{id}/resumes': {
    get: {
      summary: 'Get Applicant resumes (v1 API)',
      description: 'Returns resumes for a specific Applicant. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Resumes retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Resume' }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    },
    post: {
      summary: 'Upload Applicant resume (v1 API)',
      description: 'Uploads a resume for a specific Applicant. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: { type: 'string', format: 'binary' },
                title: { type: 'string', nullable: true },
                isPrimary: { type: 'boolean', default: false }
              },
              required: ['file']
            }
          }
        }
      },
      responses: {
        '201': {
          description: 'Resume uploaded successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Resume' } } }
        },
        '400': { description: 'Invalid file or input' },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    }
  },
  '/api/v1/Applicants/{id}/source': {
    get: {
      summary: 'Get Applicant source (v1 API)',
      description: 'Returns the source information for a specific Applicant. Requires Bearer token authentication.',
      tags: ['V1 Applicants'],
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, description: 'Applicant ID', schema: { type: 'string' } }
      ],
      responses: {
        '200': {
          description: 'Applicant source retrieved successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicantSource' } } }
        },
        '401': { description: 'Unauthorized' },
        '404': { description: 'Applicant not found' }
      }
    },
    put: {
      summary: 'Update Applicant source (v1 API)',
      description: 'Updates the source information for a specific Applicant. Requires Bearer token authentication.',
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
                sourceId: { type: 'string' },
                sourceUrl: { type: 'string', nullable: true },
                sourceNotes: { type: 'string', nullable: true }
              },
              required: ['sourceId']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Applicant source updated successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ApplicantSource' } } }
        },
        '400': { description: 'Invalid input data' },
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
  }
};
