const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function makeAdmin() {
  try {
    const email = 'gvwallace@live.com'

    const user = await prisma.user.update({
      where: { email },
      data: { role: 'admin' }
    })

    console.log(`✓ Successfully updated ${user.name} (${user.email}) to admin role`)
  } catch (error) {
    console.error('Error updating user:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()
