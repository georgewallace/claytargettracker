const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const role = process.argv[3]

  if (!email || !role) {
    console.error('Usage: node update-user-role.js <email> <role>')
    process.exit(1)
  }

  const validRoles = ['shooter', 'coach', 'admin']
  if (!validRoles.includes(role)) {
    console.error(`Invalid role. Must be one of: ${validRoles.join(', ')}`)
    process.exit(1)
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role }
    })

    console.log(`✅ Successfully updated user ${user.email} to role: ${role}`)
    console.log(`User ID: ${user.id}`)
    console.log(`Name: ${user.name}`)
  } catch (error) {
    if (error.code === 'P2025') {
      console.error(`❌ User with email ${email} not found`)
    } else {
      console.error('❌ Error updating user:', error.message)
    }
    process.exit(1)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

