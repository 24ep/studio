import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Create default admin user
    console.log('Creating admin user...');
    const adminEmail = 'admin@ncc.com';
    const adminPassword = '$2a$10$dwiCxbUtCqnXeB2O8BmiyeWHL0e7rOqahafQAUACsnD4EZ9nGqPx2'; // bcrypt hash for 'nccadmin'
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        name: 'Admin User',
        email: adminEmail,
        password: adminPassword,
        role: 'Admin',
        authenticationMethod: 'basic',
        forcePasswordChange: false,
        modulePermissions: [
          'CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_MANAGE','USER_GROUPS_MANAGE','SYSTEM_SETTINGS_MANAGE','USER_PREFERENCES_MANAGE','RECRUITMENT_STAGES_MANAGE','CUSTOM_FIELDS_MANAGE','WEBHOOK_MAPPING_MANAGE','NOTIFICATION_SETTINGS_MANAGE','LOGS_VIEW'
        ]
      }
    });
    console.log('✅ Admin user created/updated');

    // Create default positions
    console.log('Creating default positions...');
    await prisma.position.upsert({
      where: { id: '11111111-1111-1111-1111-111111111111' },
      update: {},
      create: {
        id: '11111111-1111-1111-1111-111111111111',
        title: 'Software Engineer',
        department: 'Engineering',
        description: 'Develops and maintains software.'
      }
    });
    await prisma.position.upsert({
      where: { id: '22222222-2222-2222-2222-222222222222' },
      update: {},
      create: {
        id: '22222222-2222-2222-2222-222222222222',
        title: 'Product Manager',
        department: 'Product',
        description: 'Oversees product development.'
      }
    });
    console.log('✅ Default positions created/updated');

    // Create default recruitment stages
    console.log('Creating recruitment stages...');
    const stages = [
      { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Applied', description: 'Candidate has submitted their application', isSystem: true, sortOrder: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Screening', description: 'Initial screening of candidate qualifications', isSystem: true, sortOrder: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Shortlisted', description: 'Candidate has been shortlisted for further consideration', isSystem: true, sortOrder: 3 },
      { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Interview Scheduled', description: 'Interview has been scheduled with the candidate', isSystem: true, sortOrder: 4 },
      { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Interviewing', description: 'Candidate is currently in the interview process', isSystem: true, sortOrder: 5 },
      { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Offer Extended', description: 'Job offer has been extended to the candidate', isSystem: true, sortOrder: 6 },
      { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Offer Accepted', description: 'Candidate has accepted the job offer', isSystem: true, sortOrder: 7 },
      { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Hired', description: 'Candidate has been hired and started employment', isSystem: true, sortOrder: 8 },
      { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Rejected', description: 'Candidate has been rejected from the process', isSystem: true, sortOrder: 9 },
      { id: '550e8400-e29b-41d4-a716-446655440010', name: 'On Hold', description: 'Candidate application is temporarily on hold', isSystem: true, sortOrder: 10 }
    ];
    for (const stage of stages) {
      await prisma.recruitmentStage.upsert({
        where: { name: stage.name },
        update: {},
        create: stage
      });
    }
    console.log('✅ Recruitment stages created/updated');

    // Create default user groups (roles)
    console.log('Creating user groups...');
    const userGroups = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Admin',
        description: 'Full system access',
        permissions: [
          'CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_MANAGE','USER_GROUPS_MANAGE','SYSTEM_SETTINGS_MANAGE','USER_PREFERENCES_MANAGE','RECRUITMENT_STAGES_MANAGE','CUSTOM_FIELDS_MANAGE','WEBHOOK_MAPPING_MANAGE','NOTIFICATION_SETTINGS_MANAGE','LOGS_VIEW'
        ],
        isDefault: true,
        isSystemRole: true
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Recruiter',
        description: 'Can manage candidates and positions',
        permissions: [
          'CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','RECRUITMENT_STAGES_MANAGE'
        ],
        isDefault: true,
        isSystemRole: false
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        name: 'Hiring Manager',
        description: 'Can view candidates and positions',
        permissions: [
          'CANDIDATES_VIEW','POSITIONS_VIEW'
        ],
        isDefault: true,
        isSystemRole: false
      },
      {
        id: '00000000-0000-0000-0000-000000000011',
        name: 'HR',
        description: 'HR Department group',
        permissions: [
          'HR_MANAGE','HR_CREATE','HR_UPDATE','HR_DELETE'
        ],
        isDefault: true,
        isSystemRole: false
      },
      {
        id: '00000000-0000-0000-0000-000000000012',
        name: 'IT',
        description: 'IT Department group',
        permissions: [
          'IT_MANAGE','IT_CREATE','IT_UPDATE','IT_DELETE'
        ],
        isDefault: true,
        isSystemRole: false
      },
      {
        id: '00000000-0000-0000-0000-000000000013',
        name: 'Finance',
        description: 'Finance Department group',
        permissions: [
          'FINANCE_MANAGE','FINANCE_CREATE','FINANCE_UPDATE','FINANCE_DELETE'
        ],
        isDefault: false,
        isSystemRole: false
      },
      {
        id: '00000000-0000-0000-0000-000000000014',
        name: 'Marketing',
        description: 'Marketing Department group',
        permissions: [
          'MARKETING_MANAGE','MARKETING_CREATE','MARKETING_UPDATE','MARKETING_DELETE'
        ],
        isDefault: false,
        isSystemRole: false
      }
    ];
    for (const group of userGroups) {
      await prisma.userGroup.upsert({
        where: { id: group.id },
        update: {},
        create: group
      });
    }
    console.log('✅ User groups created/updated');

    // Assign default admin user to Admin group
    console.log('Assigning admin user to Admin group...');
    const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (adminUser) {
      await prisma.user_UserGroup.upsert({
        where: { userId_groupId: { userId: adminUser.id, groupId: '00000000-0000-0000-0000-000000000001' } },
        update: {},
        create: { userId: adminUser.id, groupId: '00000000-0000-0000-0000-000000000001' }
      });
      console.log('✅ Admin user assigned to Admin group');
    }

    // Seed default notification channels
    console.log('Creating notification channels...');
    const notificationChannels = [
      { id: '10000000-0000-0000-0000-000000000001', channelKey: 'email', label: 'Email' },
      { id: '10000000-0000-0000-0000-000000000002', channelKey: 'webhook', label: 'Webhook' }
    ];
    for (const channel of notificationChannels) {
      await prisma.notificationChannel.upsert({
        where: { channelKey: channel.channelKey },
        update: {},
        create: channel
      });
    }
    console.log('✅ Notification channels created/updated');

    // Seed default notification events
    console.log('Creating notification events...');
    const notificationEvents = [
      { id: '20000000-0000-0000-0000-000000000001', eventKey: 'candidate_created', label: 'Candidate Created', description: 'Triggered when a new candidate is created.' },
      { id: '20000000-0000-0000-0000-000000000002', eventKey: 'position_filled', label: 'Position Filled', description: 'Triggered when a position is filled.' },
      { id: '20000000-0000-0000-0000-000000000003', eventKey: 'stage_changed', label: 'Stage Changed', description: 'Triggered when a candidate changes recruitment stage.' }
    ];
    for (const event of notificationEvents) {
      await prisma.notificationEvent.upsert({
        where: { eventKey: event.eventKey },
        update: {},
        create: event
      });
    }
    console.log('✅ Notification events created/updated');

    // Seed default system settings
    console.log('Creating default system settings...');
    const systemSettings = [
      { key: 'appName', value: 'CandiTrack' },
      { key: 'appThemePreference', value: 'system' },
      { key: 'primaryGradientStart', value: '179 67% 66%' },
      { key: 'primaryGradientEnd', value: '238 74% 61%' },
      { key: 'loginPageLayoutType', value: '2column' },
      // Sidebar Light Theme
      { key: 'sidebarBgStartL', value: '220 25% 97%' },
      { key: 'sidebarTextL', value: '220 25% 30%' },
      { key: 'sidebarBorderL', value: '220 15% 85%' },
      { key: 'sidebarActiveBgStartL', value: '179 67% 66%' },
      { key: 'sidebarActiveTextL', value: '0 0% 100%' },
      { key: 'sidebarHoverBgL', value: '220 10% 92%' },
      { key: 'sidebarHoverTextL', value: '220 25% 25%' },
      // Sidebar Dark Theme
      { key: 'sidebarBgStartD', value: '220 15% 12%' },
      { key: 'sidebarTextD', value: '210 30% 85%' },
      { key: 'sidebarBorderD', value: '220 15% 18%' },
      { key: 'sidebarActiveBgStartD', value: '179 67% 66%' },
      { key: 'sidebarActiveTextD', value: '0 0% 100%' },
      { key: 'sidebarHoverBgD', value: '220 15% 20%' },
      { key: 'sidebarHoverTextD', value: '210 30% 90%' },
    ];
    for (const setting of systemSettings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      });
    }
    console.log('✅ System settings created/updated');

    // Seed default data models for candidates and positions
    console.log('Creating default data models...');
    const dataModels = [
      {
        id: '30000000-0000-0000-0000-000000000001',
        name: 'Candidate Profile',
        modelType: 'Candidate',
        description: 'Standard candidate data model with personal and professional information',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true, label: 'Full Name', description: 'Candidate\'s full name' },
            email: { type: 'string', format: 'email', required: true, label: 'Email Address', description: 'Primary email contact' },
            phone: { type: 'string', label: 'Phone Number', description: 'Contact phone number' },
            positionId: { type: 'string', label: 'Applied Position', description: 'Position the candidate applied for' },
            recruiterId: { type: 'string', label: 'Assigned Recruiter', description: 'Recruiter responsible for this candidate' },
            fitScore: { type: 'number', label: 'Fit Score', description: 'AI-generated fit score for the position' },
            status: { type: 'string', label: 'Application Status', description: 'Current status in recruitment process' },
            applicationDate: { type: 'date', label: 'Application Date', description: 'When the candidate applied' },
            avatarUrl: { type: 'string', label: 'Avatar URL', description: 'Profile picture URL' },
            dataAiHint: { type: 'string', label: 'AI Data Hint', description: 'Additional data for AI processing' },
            customAttributes: { type: 'object', label: 'Custom Attributes', description: 'Additional custom fields' }
          },
          required: ['name', 'email']
        },
        isActive: true
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        name: 'Job Position',
        modelType: 'Position',
        description: 'Job position data model with requirements and details',
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string', required: true, label: 'Job Title', description: 'Position title' },
            department: { type: 'string', required: true, label: 'Department', description: 'Department this position belongs to' },
            description: { type: 'string', label: 'Job Description', description: 'Detailed job description' },
            isOpen: { type: 'boolean', label: 'Position Open', description: 'Whether the position is currently open' },
            positionLevel: { type: 'string', label: 'Position Level', description: 'Seniority level of the position' },
            customAttributes: { type: 'object', label: 'Custom Attributes', description: 'Additional custom fields' }
          },
          required: ['title', 'department']
        },
        isActive: true
      },
      {
        id: '30000000-0000-0000-0000-000000000003',
        name: 'User Profile',
        modelType: 'User',
        description: 'User profile data model for system users',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', required: true, label: 'Full Name', description: 'User\'s full name' },
            email: { type: 'string', format: 'email', required: true, label: 'Email Address', description: 'User\'s email address' },
            role: { type: 'string', label: 'User Role', description: 'System role (Admin, Recruiter, etc.)' },
            avatarUrl: { type: 'string', label: 'Avatar URL', description: 'Profile picture URL' },
            modulePermissions: { type: 'array', items: { type: 'string' }, label: 'Module Permissions', description: 'List of module permissions' },
            authenticationMethod: { type: 'string', label: 'Authentication Method', description: 'How the user authenticates' },
            forcePasswordChange: { type: 'boolean', label: 'Force Password Change', description: 'Whether user must change password' }
          },
          required: ['name', 'email']
        },
        isActive: true
      }
    ];
    
    for (const dataModel of dataModels) {
      await prisma.dataModel.upsert({
        where: { id: dataModel.id },
        update: {},
        create: dataModel
      });
    }
    console.log('✅ Default data models created/updated');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 