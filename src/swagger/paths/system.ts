// System API paths for Swagger documentation

export const systemPaths = {
  '/api/system/status': {
    get: {
      summary: 'Get system status',
      description: 'Retrieve overall system health and status information.',
      tags: ['System'],
      responses: {
        '200': {
          description: 'System status retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  uptime: { type: 'number' },
                  version: { type: 'string' },
                  environment: { type: 'string' },
                  services: {
                    type: 'object',
                    properties: {
                      database: { type: 'string' },
                      redis: { type: 'string' },
                      minio: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        '500': { description: 'Internal server error' }
      }
    }
  },
  '/api/system/info': {
    get: {
      summary: 'Get system information',
      description: 'Retrieve detailed system information and configuration.',
      tags: ['System'],
      responses: {
        '200': {
          description: 'System information retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  platform: { type: 'string' },
                  nodeVersion: { type: 'string' },
                  memory: {
                    type: 'object',
                    properties: {
                      total: { type: 'number' },
                      used: { type: 'number' },
                      free: { type: 'number' }
                    }
                  },
                  cpu: {
                    type: 'object',
                    properties: {
                      cores: { type: 'number' },
                      load: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        },
        '500': { description: 'Internal server error' }
      }
    }
  },
  '/api/system/container-metrics': {
    get: {
      summary: 'Get container-specific metrics and information',
      description: 'Retrieve detailed container information including Docker stats, container status, and resource usage.',
      tags: ['System', 'Monitoring', 'Containers'],
      responses: {
        '200': {
          description: 'Container metrics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string' },
                  containers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        status: { type: 'string' },
                        image: { type: 'string' },
                        ports: { type: 'string' },
                        cpu: {
                          type: 'object',
                          properties: {
                            usage: { type: 'string' },
                            percentage: { type: 'number' }
                          }
                        },
                        memory: {
                          type: 'object',
                          properties: {
                            usage: { type: 'string' },
                            percentage: { type: 'number' }
                          }
                        },
                        network: {
                          type: 'object',
                          properties: {
                            rx: { type: 'string' },
                            tx: { type: 'string' }
                          }
                        },
                        disk: {
                          type: 'object',
                          properties: {
                            io: { type: 'string' }
                          }
                        },
                        processes: { type: 'number' }
                      }
                    }
                  },
                  dockerInfo: {
                    type: 'object',
                    properties: {
                      version: { type: 'string' },
                      containers: { type: 'number' },
                      images: { type: 'number' },
                      system: {
                        type: 'object',
                        properties: {
                          totalMemory: { type: 'string' },
                          totalDisk: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' },
        '403': { description: 'Forbidden - Admin access required' },
        '500': { description: 'Internal server error' }
      }
    }
  }
};
