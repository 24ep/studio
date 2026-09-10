const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('--- User Fix Script Start ---');
  
  const adminPassword = 'Admin@123';
  const demoPassword = 'CHANGE_ME_DEMO_SEED_PASSWORD';
  
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const demoHash = await bcrypt.hash(demoPassword, 10);

  // 1. Find the Admin Group
  const adminGroup = await prisma.userGroup.findFirst({
    where: { name: 'Admin' }
  });

  if (!adminGroup) {
    console.error('❌ Admin group not found. Please run the main seed script first.');
    return;
  }

  console.log(`Found Admin Group ID: ${adminGroup.id}`);

  // 2. Fix admin@example.com
  console.log('Fixing admin@example.com...');
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      password: adminHash,
      isActive: true,
      role: 'Admin',
      userGroupId: adminGroup.id,
      failedLoginAttempts: 0,
      authenticationMethods: ['basic']
    },
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminHash,
      isActive: true,
      role: 'Admin',
      userGroupId: adminGroup.id,
      authenticationMethods: ['basic']
    }
  });
  console.log('admin@example.com fixed');

  // 3. Fix secondary demo admin
  console.log('Fixing demo-admin@example.com...');
  await prisma.user.upsert({
    where: { email: 'demo-admin@example.com' },
    update: {
      password: demoHash,
      isActive: true,
      role: 'Admin',
      userGroupId: adminGroup.id,
      failedLoginAttempts: 0,
      authenticationMethods: ['basic']
    },
    create: {
      name: 'HRI Demo Admin',
      email: 'demo-admin@example.com',
      password: demoHash,
      isActive: true,
      role: 'Admin',
      userGroupId: adminGroup.id,
      authenticationMethods: ['basic']
    }
  });
  console.log('demo-admin@example.com fixed');

  console.log('--- User Fix Script End ---');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
