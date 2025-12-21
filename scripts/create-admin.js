const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('👤 Creating admin user...\n');

  const email = 'gvwallace@live.com';
  const password = 'ChangeMe123!';
  const name = 'George Wallace';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`✅ Admin user already exists: ${email}`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Role: ${existingUser.role}\n`);

      // Update to admin if not already
      if (existingUser.role !== 'admin') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'admin' }
        });
        console.log('✓ Updated role to admin\n');
      }
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'admin'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`\n🔑 Default password: ${password}`);
    console.log('   Please change this password after first login!\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
