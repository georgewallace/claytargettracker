/**
 * One-time script to fix athlete divisions
 * Recalculates division from grade for all athletes
 *
 * Run with: npx tsx scripts/fix-athlete-divisions.ts
 */

import { PrismaClient } from '@prisma/client'
import { calculateDivision } from '../lib/divisions'

const prisma = new PrismaClient()

async function fixAthleteDivisions() {
  console.log('Starting division fix...')

  // Get all athletes
  const athletes = await prisma.athlete.findMany({
    select: {
      id: true,
      grade: true,
      division: true,
      user: {
        select: {
          name: true
        }
      }
    }
  })

  console.log(`Found ${athletes.length} athletes`)

  let fixed = 0
  let skipped = 0

  for (const athlete of athletes) {
    const correctDivision = calculateDivision(athlete.grade)

    if (athlete.division !== correctDivision) {
      console.log(`Fixing ${athlete.user.name}: ${athlete.division} → ${correctDivision} (grade: ${athlete.grade})`)

      await prisma.athlete.update({
        where: { id: athlete.id },
        data: { division: correctDivision }
      })

      fixed++
    } else {
      skipped++
    }
  }

  console.log(`\nComplete!`)
  console.log(`Fixed: ${fixed}`)
  console.log(`Skipped (already correct): ${skipped}`)
}

fixAthleteDivisions()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
