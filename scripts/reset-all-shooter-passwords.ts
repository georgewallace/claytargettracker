import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Resetting all shooter passwords to "demo"...\n')

  // Get all users with shooter role
  const shooters = await prisma.user.findMany({
    where: {
      role: 'shooter',
      shooter: {
        isNot: null
      }
    },
    include: {
      shooter: true
    },
    orderBy: {
      name: 'asc'
    }
  })

  if (shooters.length === 0) {
    console.log('❌ No shooters found in the database.')
    return
  }

  console.log(`📊 Found ${shooters.length} shooters\n`)

  // Hash the new password once
  const newPassword = 'demo'
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update all shooter passwords
  let successCount = 0
  let errorCount = 0

  for (const shooter of shooters) {
    try {
      await prisma.user.update({
        where: { id: shooter.id },
        data: {
          password: hashedPassword
        }
      })
      console.log(`✅ Reset password for: ${shooter.name} (${shooter.email})`)
      successCount++
    } catch (error) {
      console.log(`❌ Failed to reset password for: ${shooter.name} (${shooter.email})`)
      errorCount++
    }
  }

  console.log('\n✅ Password reset complete!')
  console.log(`\n📊 Summary:`)
  console.log(`   - Success: ${successCount} shooters`)
  console.log(`   - Failed: ${errorCount} shooters`)
  console.log(`\n🔑 All shooters can now login with:`)
  console.log(`   Password: demo`)
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

