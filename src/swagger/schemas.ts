// OpenAPI schemas for hrive API

export const schemas = {
  applicant: {
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
      customAttributes: { type: 'object', additionalProperties: true, nullable: true },
      resumePath: { type: 'string', nullable: true },
      applicationDate: { type: 'string', format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time', description: 'Set automatically by the backend/database.' },
      updatedAt: { type: 'string', format: 'date-time', description: 'Set automatically by the backend/database and updated on every change.' },
      positionTitle: { type: 'string', nullable: true },
      recruiterName: { type: 'string', nullable: true },
      educationData: {
        type: 'array',
        items: { $ref: '#/components/schemas/StructuredEducationEntry' },
        description: 'Structured education data with separate date fields'
      },
      experienceData: {
        type: 'array',
        items: { $ref: '#/components/schemas/StructuredExperienceEntry' },
        description: 'Structured experience data with separate date fields'
      }
    },
    required: ['name', 'email', 'status']
  },
  ApplicantUpdate: {
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
      customAttributes: { type: 'object', additionalProperties: true, nullable: true },
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
      matchCriteria: { type: 'string', nullable: true, description: 'Match criteria in HTML format' },
      isOpen: { type: 'boolean' },
      positionLevel: { type: 'string', nullable: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['title', 'department', 'isOpen']
  },
  PositionUpdate: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 1 },
      department: { type: 'string', minLength: 1 },
      description: { type: 'string', nullable: true },
      matchCriteria: { type: 'string', nullable: true },
      isOpen: { type: 'boolean' },
      positionLevel: { type: 'string', nullable: true }
    }
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string', nullable: true },
      email: { type: 'string', format: 'email' },
      role: { type: 'string' },
      modulePermissions: { type: 'array', items: { type: 'string' } },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['email', 'role']
  },
  UserUpdate: {
    type: 'object',
    properties: {
      name: { type: 'string', nullable: true },
      email: { type: 'string', format: 'email' },
      role: { type: 'string' },
      modulePermissions: { type: 'array', items: { type: 'string' } }
    },
    required: ['email', 'role']
  },
  Notification: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      message: { type: 'string' },
      type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
      isRead: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    },
    required: ['userId', 'title', 'message', 'type']
  },
  JobMatch: {
    type: 'object',
    properties: {
      fitScore: { type: 'number', minimum: 0, maximum: 100, description: 'Fit score between 0-100' },
      jobId: { type: 'string', format: 'uuid', description: 'Position ID to match with' },
      matchReasons: { type: 'array', items: { type: 'string' }, description: 'Array of reasons for the match' }
    },
    required: ['fitScore', 'jobId'],
    description: 'Job match request data. Only includes fields that need to be provided in requests.'
  },
  JobApplied: {
    type: 'object',
    properties: {
      fitScore: { type: 'number', minimum: 0, maximum: 100 },
      jobId: { type: 'string', format: 'uuid' },
      justification: { type: 'array', items: { type: 'string' } }
    },
    required: ['fitScore', 'jobId']
  },
  Attachment: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      applicantId: { type: 'string', format: 'uuid' },
      uploadedById: { type: 'string', format: 'uuid' },
      filePath: { type: 'string' },
      fileName: { type: 'string' },
      isPrimary: { type: 'boolean' },
      uploadedAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      url: { type: 'string', description: 'Public URL to access the attachment file' },
      label: { type: 'string', enum: ['resume', 'certificate', 'other'] },
      uploadedBy: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true }
        }
      }
    }
  },
  StructuredEducationEntry: {
    type: 'object',
    properties: {
      university: { type: 'string', description: 'University name' },
      major: { type: 'string', nullable: true, description: 'Major/degree field' },
      field: { type: 'string', nullable: true, description: 'Field of study' },
      campus: { type: 'string', nullable: true, description: 'Campus location' },
      startMonth: { type: 'integer', minimum: 1, maximum: 12, description: 'Start month (1-12)' },
      startYear: { type: 'integer', minimum: 1900, maximum: 2100, description: 'Start year' },
      endMonth: { type: 'integer', minimum: 1, maximum: 12, nullable: true, description: 'End month (1-12), null if current' },
      endYear: { type: 'integer', minimum: 1900, maximum: 2100, nullable: true, description: 'End year, null if current' },
      isCurrent: { type: 'boolean', description: 'Whether this is current education' },
      GPA: { type: 'string', nullable: true, description: 'Grade Point Average' },
      duration: { type: 'string', nullable: true, description: 'Calculated duration (e.g., "2 years 6 months")' }
    },
    required: ['university', 'startMonth', 'startYear', 'isCurrent']
  },
  StructuredExperienceEntry: {
    type: 'object',
    properties: {
      company: { type: 'string', description: 'Company name' },
      position: { type: 'string', description: 'Job position/title' },
      description: { type: 'string', nullable: true, description: 'Job description' },
      startMonth: { type: 'integer', minimum: 1, maximum: 12, description: 'Start month (1-12)' },
      startYear: { type: 'integer', minimum: 1900, maximum: 2100, description: 'Start year' },
      endMonth: { type: 'integer', minimum: 1, maximum: 12, nullable: true, description: 'End month (1-12), null if current' },
      endYear: { type: 'integer', minimum: 1900, maximum: 2100, nullable: true, description: 'End year, null if current' },
      isCurrent: { type: 'boolean', description: 'Whether this is current position' },
      positionLevel: { type: 'string', nullable: true, description: 'Position level (entry level, mid level, senior level, etc.)' },
      duration: { type: 'string', nullable: true, description: 'Calculated duration (e.g., "3 years 2 months")' }
    },
    required: ['company', 'position', 'startMonth', 'startYear', 'isCurrent']
  }
};
