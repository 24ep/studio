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
                'CANDIDATES_VIEW', 'CANDIDATES_MANAGE', 'CANDIDATES_IMPORT', 'CANDIDATES_EXPORT', 'POSITIONS_VIEW', 'POSITIONS_MANAGE', 'POSITIONS_IMPORT', 'POSITIONS_EXPORT', 'USERS_MANAGE', 'USER_GROUPS_MANAGE', 'SYSTEM_SETTINGS_MANAGE', 'USER_PREFERENCES_MANAGE', 'RECRUITMENT_STAGES_MANAGE', 'CUSTOM_FIELDS_MANAGE', 'WEBHOOK_MAPPING_MANAGE', 'NOTIFICATION_SETTINGS_MANAGE', 'LOGS_VIEW'
            ]
        }
    });
    // Create default positions
    await prisma.position.upsert({
        where: { title: 'Software Engineer' },
        update: {},
        create: {
            title: 'Software Engineer',
            department: 'Engineering',
            description: 'Develops and maintains software.'
        }
    });
    await prisma.position.upsert({
        where: { title: 'Product Manager' },
        update: {},
        create: {
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
}
main()
    .catch(e => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
