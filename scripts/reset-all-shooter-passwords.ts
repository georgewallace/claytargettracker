import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Resetting all athlete passwords to "demo"...\n')

  // Get all users with athlete role
  const athletes = await prisma.user.findMany({
    where: {
      role: 'athlete',
      athlete: {
        isNot: null
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  if (athletes.length === 0) {
    console.log('❌ No athletes found in the database.')
    return
  }

  console.log(`📊 Found ${athletes.length} athletes\n`)

  // Hash the new password once
  const newPassword = 'demo'
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update all athlete passwords
  let successCount = 0
  let errorCount = 0

  for (const athlete of athletes) {
    try {
      await prisma.user.update({
        where: { id: athlete.id },
        data: {
          password: hashedPassword
        }
      })
      console.log(`✅ Reset password for: ${athlete.name} (${athlete.email})`)
      successCount++
    } catch (error) {
      console.log(`❌ Failed to reset password for: ${athlete.name} (${athlete.email})`)
      errorCount++
    }
  }

  console.log('\n✅ Password reset complete!')
  console.log(`\n📊 Summary:`)
  console.log(`   - Success: ${successCount} athletes`)
  console.log(`   - Failed: ${errorCount} athletes`)
  console.log(`\n🔑 All athletes can now login with:`)
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

