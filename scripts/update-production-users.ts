import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Updating production users...')
  console.log('')

  // 1. Reset gvwallace@live.com password to 'demo'
  console.log('🔐 Resetting password for gvwallace@live.com...')
  const gvwallace = await prisma.user.findUnique({
    where: { email: 'gvwallace@live.com' }
  })

  if (gvwallace) {
    const hashedPassword = await bcrypt.hash('demo', 10)
    await prisma.user.update({
      where: { id: gvwallace.id },
      data: { password: hashedPassword }
    })
    console.log('✅ Password reset to: demo')
  } else {
    console.log('⚠️  User gvwallace@live.com not found')
  }

  console.log('')

  // 2. Update coach@coach.com to admin
  console.log('👑 Updating coach@coach.com to admin...')
  const coach = await prisma.user.findUnique({
    where: { email: 'coach@coach.com' }
  })

  if (coach) {
    await prisma.user.update({
      where: { id: coach.id },
      data: { role: 'admin' }
    })
    console.log('✅ Updated to admin role')
    console.log(`   Current password: (unchanged - use existing password)`)
  } else {
    console.log('⚠️  User coach@coach.com not found')
  }

  console.log('')
  console.log('🎉 Production users updated!')
  console.log('')
  console.log('📋 Login Credentials:')
  console.log('   1. gvwallace@live.com / demo (Admin)')
  console.log('   2. coach@coach.com / <existing password> (Admin)')
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

