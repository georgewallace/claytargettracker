import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Resetting password for gvwallace@live.com...')

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: 'gvwallace@live.com' }
  })

  if (!user) {
    console.log('❌ User not found with email gvwallace@live.com')
    return
  }

  console.log('✅ Found user:', user.name)

  // Hash new password
  const newPassword = 'demo'
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword
    }
  })

  console.log('✅ Password reset to: demo')
  console.log('🎉 You can now login with:')
  console.log('   Email: gvwallace@live.com')
  console.log('   Password: demo')
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

