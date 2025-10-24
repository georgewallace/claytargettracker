import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') })

const prisma = new PrismaClient()

// Name-based gender inference (simple heuristic)
const maleNames = ['john', 'george', 'michael', 'david', 'james', 'robert', 'william', 'richard', 'thomas', 'charles', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'timothy', 'ronald', 'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'raymond', 'gregory', 'alexander', 'patrick', 'frank', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'adam', 'henry', 'nathan', 'douglas', 'zachary', 'peter', 'kyle', 'walter', 'ethan', 'jeremy', 'harold', 'keith', 'christian', 'roger', 'noah', 'gerald', 'carl', 'terry', 'sean', 'austin', 'arthur', 'lawrence', 'jesse', 'dylan', 'bryan', 'joe', 'jordan', 'billy', 'bruce', 'albert', 'willie', 'gabriel', 'logan', 'alan', 'juan', 'wayne', 'roy', 'ralph', 'randy', 'eugene', 'vincent', 'russell', 'elijah', 'louis', 'bobby', 'philip', 'johnny']

const femaleNames = ['mary', 'patricia', 'jennifer', 'linda', 'barbara', 'elizabeth', 'jessica', 'sarah', 'karen', 'nancy', 'lisa', 'betty', 'margaret', 'sandra', 'ashley', 'kimberly', 'emily', 'donna', 'michelle', 'dorothy', 'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia', 'kathleen', 'amy', 'angela', 'shirley', 'anna', 'brenda', 'pamela', 'emma', 'nicole', 'helen', 'samantha', 'katherine', 'christine', 'debra', 'rachel', 'carolyn', 'janet', 'catherine', 'maria', 'heather', 'diane', 'ruth', 'julie', 'olivia', 'joyce', 'virginia', 'victoria', 'kelly', 'lauren', 'christina', 'joan', 'evelyn', 'judith', 'megan', 'andrea', 'cheryl', 'hannah', 'jacqueline', 'martha', 'gloria', 'teresa', 'ann', 'sara', 'madison', 'frances', 'kathryn', 'janice', 'jean', 'abigail', 'alice', 'judy', 'sophia', 'grace', 'denise', 'amber', 'doris', 'marilyn', 'danielle', 'beverly', 'isabella', 'theresa', 'diana', 'natalie', 'brittany', 'charlotte', 'marie', 'kayla', 'alexis', 'lori']

function inferGender(name: string): 'Male' | 'Female' | null {
  const firstName = name.split(' ')[0].toLowerCase()
  
  if (maleNames.includes(firstName)) {
    return 'Male'
  }
  if (femaleNames.includes(firstName)) {
    return 'Female'
  }
  return null
}

async function main() {
  console.log('🧹 Starting shooter cleanup and gender assignment...\n')

  try {
    // 1. Remove shooter profiles for coaches
    console.log('Step 1: Removing shooter profiles for coaches...')
    
    const coachesToRemove = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'coach@coach.com' },
          { email: 'gvwallace@live.com' },
        ],
        shooter: {
          isNot: null
        }
      },
      include: {
        shooter: true
      }
    })

    for (const coach of coachesToRemove) {
      if (coach.shooter) {
        console.log(`  - Removing shooter profile for ${coach.name} (${coach.email})`)
        
        // Delete related records first
        await prisma.$transaction([
          // Delete shooter averages
          prisma.shooterAverage.deleteMany({
            where: { shooterId: coach.shooter.id }
          }),
          // Delete squad memberships
          prisma.squadMember.deleteMany({
            where: { shooterId: coach.shooter.id }
          }),
          // Delete shoots
          prisma.shoot.deleteMany({
            where: { shooterId: coach.shooter.id }
          }),
          // Delete registration disciplines
          prisma.registrationDiscipline.deleteMany({
            where: {
              registration: {
                shooterId: coach.shooter.id
              }
            }
          }),
          // Delete registrations
          prisma.registration.deleteMany({
            where: { shooterId: coach.shooter.id }
          }),
          // Delete team join requests
          prisma.teamJoinRequest.deleteMany({
            where: { shooterId: coach.shooter.id }
          }),
          // Finally, delete the shooter profile
          prisma.shooter.delete({
            where: { id: coach.shooter.id }
          })
        ])
        
        console.log(`    ✅ Removed shooter profile for ${coach.name}`)
      }
    }

    // 2. Add genders to all shooters based on names
    console.log('\nStep 2: Adding genders to shooters based on names...')
    
    const shooters = await prisma.shooter.findMany({
      include: {
        user: true
      }
    })

    let updatedCount = 0
    let skippedCount = 0

    for (const shooter of shooters) {
      // Skip if gender already set
      if (shooter.gender) {
        console.log(`  - Skipping ${shooter.user.name} (gender already set: ${shooter.gender})`)
        skippedCount++
        continue
      }

      const inferredGender = inferGender(shooter.user.name)
      
      if (inferredGender) {
        await prisma.shooter.update({
          where: { id: shooter.id },
          data: { gender: inferredGender }
        })
        console.log(`  - Set ${shooter.user.name} as ${inferredGender}`)
        updatedCount++
      } else {
        console.log(`  - Could not infer gender for ${shooter.user.name} (please set manually)`)
        skippedCount++
      }
    }

    console.log(`\n✅ Gender assignment complete!`)
    console.log(`   - Updated: ${updatedCount} shooters`)
    console.log(`   - Skipped: ${skippedCount} shooters`)

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

