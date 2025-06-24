import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
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
      modulePermissions: [
        'CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_MANAGE','USER_GROUPS_MANAGE','SYSTEM_SETTINGS_MANAGE','USER_PREFERENCES_MANAGE','RECRUITMENT_STAGES_MANAGE','CUSTOM_FIELDS_MANAGE','WEBHOOK_MAPPING_MANAGE','NOTIFICATION_SETTINGS_MANAGE','LOGS_VIEW'
      ]
    }
  });

  // Create default positions
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

  // Create default recruitment stages
  const stages = [
    { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Applied', description: 'Candidate has submitted their application', is_system: true, sort_order: 1 },
    { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Screening', description: 'Initial screening of candidate qualifications', is_system: true, sort_order: 2 },
    { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Shortlisted', description: 'Candidate has been shortlisted for further consideration', is_system: true, sort_order: 3 },
    { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Interview Scheduled', description: 'Interview has been scheduled with the candidate', is_system: true, sort_order: 4 },
    { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Interviewing', description: 'Candidate is currently in the interview process', is_system: true, sort_order: 5 },
    { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Offer Extended', description: 'Job offer has been extended to the candidate', is_system: true, sort_order: 6 },
    { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Offer Accepted', description: 'Candidate has accepted the job offer', is_system: true, sort_order: 7 },
    { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Hired', description: 'Candidate has been hired and started employment', is_system: true, sort_order: 8 },
    { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Rejected', description: 'Candidate has been rejected from the process', is_system: true, sort_order: 9 },
    { id: '550e8400-e29b-41d4-a716-446655440010', name: 'On Hold', description: 'Candidate application is temporarily on hold', is_system: true, sort_order: 10 }
  ];
  for (const stage of stages) {
    await prisma.recruitmentStage.upsert({
      where: { name: stage.name },
      update: {},
      create: stage
    });
  }

  // Create default user groups (roles)
  const userGroups = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Admin',
      description: 'Full system access',
      permissions: [
        'CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','USERS_MANAGE','USER_GROUPS_MANAGE','SYSTEM_SETTINGS_MANAGE','USER_PREFERENCES_MANAGE','RECRUITMENT_STAGES_MANAGE','CUSTOM_FIELDS_MANAGE','WEBHOOK_MAPPING_MANAGE','NOTIFICATION_SETTINGS_MANAGE','LOGS_VIEW'
      ],
      is_default: true,
      is_system_role: true
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Recruiter',
      description: 'Can manage candidates and positions',
      permissions: [
        'CANDIDATES_VIEW','CANDIDATES_MANAGE','CANDIDATES_IMPORT','CANDIDATES_EXPORT','POSITIONS_VIEW','POSITIONS_MANAGE','POSITIONS_IMPORT','POSITIONS_EXPORT','RECRUITMENT_STAGES_MANAGE'
      ],
      is_default: true,
      is_system_role: false
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Hiring Manager',
      description: 'Can view candidates and positions',
      permissions: [
        'CANDIDATES_VIEW','POSITIONS_VIEW'
      ],
      is_default: true,
      is_system_role: false
    },
    {
      id: '00000000-0000-0000-0000-000000000011',
      name: 'HR',
      description: 'HR Department group',
      permissions: [
        'HR_MANAGE','HR_CREATE','HR_UPDATE','HR_DELETE'
      ],
      is_default: true,
      is_system_role: false
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      name: 'IT',
      description: 'IT Department group',
      permissions: [
        'IT_MANAGE','IT_CREATE','IT_UPDATE','IT_DELETE'
      ],
      is_default: true,
      is_system_role: false
    },
    {
      id: '00000000-0000-0000-0000-000000000013',
      name: 'Finance',
      description: 'Finance Department group',
      permissions: [
        'FINANCE_MANAGE','FINANCE_CREATE','FINANCE_UPDATE','FINANCE_DELETE'
      ],
      is_default: false,
      is_system_role: false
    },
    {
      id: '00000000-0000-0000-0000-000000000014',
      name: 'Marketing',
      description: 'Marketing Department group',
      permissions: [
        'MARKETING_MANAGE','MARKETING_CREATE','MARKETING_UPDATE','MARKETING_DELETE'
      ],
      is_default: false,
      is_system_role: false
    }
  ];
  for (const group of userGroups) {
    await prisma.userGroup.upsert({
      where: { id: group.id },
      update: {},
      create: group
    });
  }

  // Assign default admin user to Admin group
  const adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (adminUser) {
    await prisma.user_UserGroup.upsert({
      where: { userId_groupId: { userId: adminUser.id, groupId: '00000000-0000-0000-0000-000000000001' } },
      update: {},
      create: { userId: adminUser.id, groupId: '00000000-0000-0000-0000-000000000001' }
    });
  }

  // Seed default notification channels
  const notificationChannels = [
    { id: '10000000-0000-0000-0000-000000000001', channel_key: 'email', label: 'Email' },
    { id: '10000000-0000-0000-0000-000000000002', channel_key: 'webhook', label: 'Webhook' }
  ];
  for (const channel of notificationChannels) {
    await prisma.notificationChannel.upsert({
      where: { channel_key: channel.channel_key },
      update: {},
      create: channel
    });
  }

  // Seed default notification events
  const notificationEvents = [
    { id: '20000000-0000-0000-0000-000000000001', event_key: 'candidate_created', label: 'Candidate Created', description: 'Triggered when a new candidate is created.' },
    { id: '20000000-0000-0000-0000-000000000002', event_key: 'position_filled', label: 'Position Filled', description: 'Triggered when a position is filled.' },
    { id: '20000000-0000-0000-0000-000000000003', event_key: 'stage_changed', label: 'Stage Changed', description: 'Triggered when a candidate changes recruitment stage.' }
  ];
  for (const event of notificationEvents) {
    await prisma.notificationEvent.upsert({
      where: { event_key: event.event_key },
      update: {},
      create: event
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 