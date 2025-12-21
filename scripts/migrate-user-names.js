const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateUserNames() {
  try {
    console.log('Starting user name migration...\n')

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true
      }
    })

    console.log(`Found ${users.length} users to process\n`)

    let updated = 0
    let skipped = 0

    for (const user of users) {
      // Skip if already has firstName and lastName
      if (user.firstName && user.lastName) {
        console.log(`⏭️  Skipping "${user.name}" - already has firstName and lastName`)
        skipped++
        continue
      }

      // Split name on first space
      const nameParts = user.name.trim().split(' ')

      let firstName, lastName

      if (nameParts.length === 1) {
        // Single name - put it all in firstName
        firstName = nameParts[0]
        lastName = ''
      } else if (nameParts.length === 2) {
        // Two parts - first and last
        firstName = nameParts[0]
        lastName = nameParts[1]
      } else {
        // Multiple parts - first part is firstName, rest is lastName
        firstName = nameParts[0]
        lastName = nameParts.slice(1).join(' ')
      }

      // Update the user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName
        }
      })

      console.log(`✓ Updated "${user.name}" → First: "${firstName}", Last: "${lastName}"`)
      updated++
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log(`Migration complete!`)
    console.log(`  ✓ Updated: ${updated}`)
    console.log(`  ⏭️  Skipped: ${skipped}`)
    console.log(`  📊 Total: ${users.length}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Error migrating user names:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateUserNames()
