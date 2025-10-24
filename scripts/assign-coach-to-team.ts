import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏫 Assigning coach@coach.com to School of hard knocks...')
  console.log('')

  // Find coach@coach.com user
  const coach = await prisma.user.findUnique({
    where: { email: 'coach@coach.com' }
  })

  if (!coach) {
    console.log('❌ User coach@coach.com not found')
    return
  }

  console.log('✅ Found user:', coach.name)

  // Check if "School of hard knocks" team exists
  let team = await prisma.team.findFirst({
    where: { name: 'School of hard knocks' }
  })

  if (team) {
    console.log('✅ Found team:', team.name)
  } else {
    // Create the team
    console.log('📝 Creating team: School of hard knocks')
    team = await prisma.team.create({
      data: {
        name: 'School of hard knocks',
      }
    })
    console.log('✅ Team created')
  }

  // Check if coach is already assigned to team
  const existingCoach = await prisma.teamCoach.findUnique({
    where: {
      teamId_userId: {
        teamId: team.id,
        userId: coach.id
      }
    }
  })

  if (existingCoach) {
    console.log('✅ Coach already assigned to this team')
  } else {
    // Assign coach to team
    await prisma.teamCoach.create({
      data: {
        teamId: team.id,
        userId: coach.id,
        role: 'head_coach'
      }
    })
    console.log('✅ Assigned coach@coach.com as coach of School of hard knocks')
  }
  console.log('')
  console.log('🎉 Assignment complete!')
  console.log('')
  console.log('📋 Team Details:')
  console.log(`   Team: ${team.name}`)
  console.log(`   Coach: ${coach.name} (${coach.email})`)
  console.log(`   Role: ${coach.role}`)
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

