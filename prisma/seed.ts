const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const candidateSystemFields = [
    { name: 'name', label: 'Full Name', type: 'TEXT', isRequired: true, isSystemField: true, order: 1 },
    { name: 'email', label: 'Email Address', type: 'TEXT', isRequired: true, isSystemField: true, order: 2 },
    { name: 'phone', label: 'Phone Number', type: 'TEXT', isRequired: false, isSystemField: true, order: 3 },
    { name: 'positionId', label: 'Applied For', type: 'TEXT', isRequired: true, isSystemField: true, order: 4 },
    { name: 'fitScore', label: 'Fit Score', type: 'NUMBER', isRequired: true, isSystemField: true, order: 5 },
    { name: 'status', label: 'Recruitment Stage', type: 'TEXT', isRequired: true, isSystemField: true, order: 6 },
    { name: 'applicationDate', label: 'Application Date', type: 'DATE', isRequired: true, isSystemField: true, order: 7 },
];

const positionSystemFields = [
    { name: 'title', label: 'Position Title', type: 'TEXT', isRequired: true, isSystemField: true, order: 1 },
    { name: 'department', label: 'Department', type: 'TEXT', isRequired: false, isSystemField: true, order: 2 },
    { name: 'description', label: 'Description', type: 'TEXTAREA', isRequired: false, isSystemField: true, order: 3 },
    { name: 'isOpen', label: 'Is Open', type: 'BOOLEAN', isRequired: true, isSystemField: true, order: 4 },
];

async function main() {
    console.log('Seeding system fields...');

    for (const field of candidateSystemFields) {
        await prisma.customFieldDefinition.upsert({
            where: { model_name: { model: 'Candidate', name: field.name } },
            update: {},
            create: {
                model: 'Candidate',
                ...field,
            },
        });
    }
    console.log('Candidate system fields seeded.');

    for (const field of positionSystemFields) {
        await prisma.customFieldDefinition.upsert({
            where: { model_name: { model: 'Position', name: field.name } },
            update: {},
            create: {
                model: 'Position',
                ...field,
            },
        });
    }
    console.log('Position system fields seeded.');

}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 