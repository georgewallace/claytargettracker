const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  const teamName = process.argv[3]

  if (!email || !teamName) {
    console.error('Usage: node assign-team-coach.js <coach-email> <team-name>')
    process.exit(1)
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    if (user.role !== 'coach' && user.role !== 'admin') {
      console.error(`❌ User ${email} is not a coach (current role: ${user.role})`)
      process.exit(1)
    }

    // Find or create the team
    let team = await prisma.team.findFirst({
      where: { name: teamName }
    })

    if (!team) {
      console.log(`Team "${teamName}" not found. Creating it...`)
      team = await prisma.team.create({
        data: {
          name: teamName,
          coachId: user.id
        }
      })
      console.log(`✅ Created team "${teamName}" with ${user.name} as coach`)
    } else {
      // Update existing team
      if (team.coachId) {
        const currentCoach = await prisma.user.findUnique({
          where: { id: team.coachId }
        })
        console.log(`⚠️  Team already has a coach: ${currentCoach?.name}`)
        console.log(`Reassigning to ${user.name}...`)
      }

      team = await prisma.team.update({
        where: { id: team.id },
        data: { coachId: user.id },
        include: {
          shooters: {
            include: {
              user: true
            }
          }
        }
      })
      console.log(`✅ Assigned ${user.name} as coach of team "${teamName}"`)
    }

    // Show team info
    console.log(`\nTeam Information:`)
    console.log(`- Team ID: ${team.id}`)
    console.log(`- Team Name: ${team.name}`)
    console.log(`- Coach: ${user.name} (${user.email})`)
    console.log(`- Roster: ${team.shooters?.length || 0} shooter(s)`)
    
    if (team.shooters && team.shooters.length > 0) {
      console.log(`\nRoster:`)
      team.shooters.forEach((shooter, i) => {
        console.log(`  ${i + 1}. ${shooter.user.name}`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

