const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('Creating admin user...');

  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is required');
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      // Update existing user's password
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          role: 'Admin',
          authenticationMethods: ['basic'],
          isActive: true,
          forcePasswordChange: false
        }
      });
      console.log('✅ Admin user password updated');
      console.log(`Email: ${adminEmail}`);
    } else {
      // Create new admin user
      await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          password: hashedPassword,
          role: 'Admin',
          authenticationMethods: ['basic'],
          isActive: true,
          forcePasswordChange: false
        }
      });
      console.log('✅ Admin user created');
      console.log(`Email: ${adminEmail}`);
    }

    // Check if user groups exist and assign admin to Admin group
    const adminGroup = await prisma.userGroup.findUnique({
      where: { id: '00000000-0000-0000-0000-000000000001' }
    });

    if (adminGroup) {
      const adminUser = await prisma.user.findUnique({
        where: { email: adminEmail }
      });

      if (adminUser) {
        if (adminUser.userGroupId !== adminGroup.id) {
          await prisma.user.update({
            where: { id: adminUser.id },
            data: { userGroupId: adminGroup.id }
          });
          console.log('✅ Admin user assigned to Admin group');
        } else {
          console.log('ℹ️ Admin user already in Admin group');
        }
      }
    } else {
      console.log('⚠️ Admin user group not found - user created without group assignment');
    }

    const verifiedUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    const passwordVerified = Boolean(
      verifiedUser?.password && await bcrypt.compare(adminPassword, verifiedUser.password)
    );

    if (
      !verifiedUser ||
      verifiedUser.role !== 'Admin' ||
      !verifiedUser.isActive ||
      verifiedUser.forcePasswordChange ||
      !verifiedUser.authenticationMethods.includes('basic') ||
      !passwordVerified
    ) {
      throw new Error('Admin account verification failed');
    }

    console.log('Admin account verification passed');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser()
  .then(() => {
    console.log('🎉 Admin user setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  });
