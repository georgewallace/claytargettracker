const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function promoteToAdmin(email, name = null) {
  console.log(`👤 Promoting ${email} to admin...\n`);

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Update to admin
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'admin' }
      });

      console.log('✅ User promoted to admin successfully!');
      console.log(`   Email: ${updatedUser.email}`);
      console.log(`   Name: ${updatedUser.name}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   User ID: ${updatedUser.id}\n`);
    } else {
      // Create new admin user
      const password = 'ChangeMe123!';
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          password: hashedPassword,
          role: 'admin'
        }
      });

      console.log('✅ Admin user created successfully!');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Name: ${newUser.name}`);
      console.log(`   Role: ${newUser.role}`);
      console.log(`   User ID: ${newUser.id}`);
      console.log(`\n🔑 Default password: ${password}`);
      console.log('   Please change this password after first login!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];
const name = process.argv[3];

if (!email) {
  console.error('Usage: node promote-to-admin.js <email> [name]');
  process.exit(1);
}

promoteToAdmin(email, name);
