/**
 * One-time script to migrate division names
 * Renames "Senior" → "Varsity" and "College-Trade School" → "Collegiate"
 *
 * Run with: npx tsx scripts/migrate-division-names.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateDivisionNames() {
  console.log('Starting division name migration...')

  // Get all athletes with divisions that need to be renamed
  const athletes = await prisma.athlete.findMany({
    where: {
      OR: [
        { division: 'Senior' },
        { division: 'College-Trade School' }
      ]
    },
    select: {
      id: true,
      division: true,
      user: {
        select: {
          name: true
        }
      }
    }
  })

  console.log(`Found ${athletes.length} athletes with divisions to migrate`)

  let seniorToVarsity = 0
  let collegeToCollegiate = 0

  for (const athlete of athletes) {
    let newDivision: string | null = null

    if (athlete.division === 'Senior') {
      newDivision = 'Varsity'
      seniorToVarsity++
    } else if (athlete.division === 'College-Trade School') {
      newDivision = 'Collegiate'
      collegeToCollegiate++
    }

    if (newDivision) {
      console.log(`Migrating ${athlete.user.name}: ${athlete.division} → ${newDivision}`)

      await prisma.athlete.update({
        where: { id: athlete.id },
        data: { division: newDivision }
      })
    }
  }

  console.log(`\nMigration complete!`)
  console.log(`Senior → Varsity: ${seniorToVarsity}`)
  console.log(`College-Trade School → Collegiate: ${collegeToCollegiate}`)
  console.log(`Total migrated: ${athletes.length}`)
}

migrateDivisionNames()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
