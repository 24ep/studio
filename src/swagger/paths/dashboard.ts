// Dashboard API paths for Swagger documentation

export const dashboardPaths = {
  '/api/v1/dashboard': {
    get: {
      summary: 'Get dashboard data (v1 API)',
      description: 'Returns dashboard statistics and data. Requires Bearer token authentication.',
      tags: ['V1 Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Dashboard data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  totalApplicants: { type: 'number' },
                  totalPositions: { type: 'number' },
                  activeRecruitments: { type: 'number' },
                  recentActivity: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        },
        '401': { description: 'Unauthorized' }
      }
    }
  }
};
