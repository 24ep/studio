// Base OpenAPI 3.0 configuration for hrive API

export const baseSwaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'hrive API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for the Studio recruitment management system',
    contact: {
      name: 'hrive API Support',
      email: 'support@studio.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.PRODUCTION_HOST || process.env.API_BASE_URL || 'http://8021_hri_app:8021',
      description: 'hrive API Server',
    },
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from NextAuth.js'
      }
    }
  },
  tags: [
    { name: 'V1 Authentication', description: 'External API authentication endpoints' },
    { name: 'V1 Positions', description: 'External API for positions' },
    { name: 'V1 Applicants', description: 'External API for Applicants' },
    { name: 'V1 Recruitment Stages', description: 'External API for recruitment stages' },
    { name: 'V1 AI Search', description: 'External API for AI-powered Applicant search' },
    { name: 'V1 Dashboard', description: 'External API for dashboard statistics' },
    { name: 'V1 Logs', description: 'External API for system logs' },
    { name: 'V1 Transitions', description: 'External API for Applicant stage transitions' },
    { name: 'V1 Settings', description: 'External API for system settings' },
    { name: 'Job Applied', description: 'Job application information endpoints' },
    { name: 'Job Matches', description: 'Job matching endpoints' },
    { name: 'Attachments', description: 'File attachment endpoints' },
    { name: 'V1 Health', description: 'Health check endpoints' },
    { name: 'V1 Bulk Actions', description: 'Bulk actions for positions and Applicants' },
    { name: 'V1 Import/Export', description: 'Import/export templates and actions' },
    { name: 'V1 Users', description: 'External API for users' },
    { name: 'V1 Notifications', description: 'External API for notifications' },
    { name: 'Notifications', description: 'Notification system endpoints' },
    { name: 'Upload Queue', description: 'File upload queue management' },
    { name: 'V1 Source Management', description: 'Applicant source management' }
  ]
};
