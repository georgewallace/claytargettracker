import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Updating john doe user...')

  // Find john doe user by email
  const johnDoe = await prisma.user.findUnique({
    where: { email: 'gvwallace@live.com' }
  })

  if (!johnDoe) {
    console.log('❌ User not found with email gvwallace@live.com')
    return
  }

  console.log('✅ Found user:', johnDoe.name)

  // Update user to admin role
  await prisma.user.update({
    where: { id: johnDoe.id },
    data: {
      role: 'admin'
    }
  })

  console.log('✅ Updated user role to admin')

  // Find Thunder Ridge Shooting Club
  const thunderRidge = await prisma.team.findFirst({
    where: { name: 'Thunder Ridge Shooting Club' }
  })

  if (!thunderRidge) {
    console.log('❌ Thunder Ridge Shooting Club not found')
    return
  }

  console.log('✅ Found team:', thunderRidge.name)

  // Assign john doe as coach of Thunder Ridge
  await prisma.team.update({
    where: { id: thunderRidge.id },
    data: {
      coachId: johnDoe.id
    }
  })

  console.log('✅ Assigned john doe as coach of Thunder Ridge Shooting Club')

  console.log('🎉 Update complete!')
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

