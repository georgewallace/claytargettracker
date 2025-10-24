import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to generate realistic scores with progression
function generateScoreProgression(
  baseAverage: number, 
  targetAverage: number, 
  numTournaments: number,
  variance: number = 5
): number[] {
  const scores: number[] = []
  const step = (targetAverage - baseAverage) / (numTournaments - 1)
  
  for (let i = 0; i < numTournaments; i++) {
    const expectedScore = baseAverage + (step * i)
    // Add some variance (±variance%)
    const randomVariance = (Math.random() - 0.5) * variance
    const score = Math.max(0, Math.min(100, expectedScore + randomVariance))
    scores.push(score)
  }
  
  return scores
}

// Helper to generate station scores that add up to target percentage
function generateStationScores(
  totalStations: number,
  targetsPerStation: number,
  targetPercentage: number
): number[] {
  const totalPossible = totalStations * targetsPerStation
  const targetHits = Math.round((targetPercentage / 100) * totalPossible)
  
  const scores: number[] = []
  let remainingHits = targetHits
  
  for (let i = 0; i < totalStations; i++) {
    const isLastStation = i === totalStations - 1
    
    if (isLastStation) {
      // Last station gets whatever is left
      scores.push(Math.max(0, Math.min(targetsPerStation, remainingHits)))
    } else {
      // Random distribution for other stations
      const maxPossible = Math.min(targetsPerStation, remainingHits)
      const minPossible = Math.max(0, remainingHits - (targetsPerStation * (totalStations - i - 1)))
      const hits = Math.floor(Math.random() * (maxPossible - minPossible + 1)) + minPossible
      scores.push(hits)
      remainingHits -= hits
    }
  }
  
  return scores
}

async function main() {
  console.log('🎯 Seeding tournament history data...\n')

  // Get admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' }
  })

  if (!admin) {
    console.log('❌ No admin user found. Please create an admin user first.')
    return
  }

  // Get disciplines
  const disciplines = await prisma.discipline.findMany()
  const trap = disciplines.find(d => d.name === 'trap')
  const skeet = disciplines.find(d => d.name === 'skeet')
  const sportingClays = disciplines.find(d => d.name === 'sporting_clays')
  const fiveStand = disciplines.find(d => d.name === 'five_stand')

  if (!trap || !skeet || !sportingClays || !fiveStand) {
    console.log('❌ Required disciplines not found. Please run seed-disciplines first.')
    return
  }

  // Get all teams and their shooters
  const teams = await prisma.team.findMany({
    include: {
      shooters: {
        include: {
          user: true
        }
      }
    }
  })

  if (teams.length === 0 || teams.every(t => t.shooters.length === 0)) {
    console.log('❌ No teams or shooters found. Please run seed-test-data first.')
    return
  }

  console.log(`📊 Found ${teams.length} teams with shooters\n`)

  // Define tournaments over the past 8 months
  const tournamentData = [
    {
      name: 'Spring Classic',
      location: 'Highland Shooting Range',
      date: new Date(Date.now() - 210 * 24 * 60 * 60 * 1000), // 7 months ago
      description: 'Annual spring tournament kick-off'
    },
    {
      name: 'April Showers Shoot',
      location: 'Meadowbrook Gun Club',
      date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
      description: 'Spring season shootout'
    },
    {
      name: 'Memorial Day Shoot',
      location: 'Veterans Memorial Range',
      date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000), // 5 months ago
      description: 'Honoring our veterans'
    },
    {
      name: 'Summer Championship',
      location: 'Lakeside Gun Club',
      date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 4 months ago
      description: 'Mid-season championship event'
    },
    {
      name: 'Independence Day Classic',
      location: 'Freedom Fields Range',
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
      description: 'Celebrating freedom and marksmanship'
    },
    {
      name: 'Labor Day Invitational',
      location: 'Pine Ridge Sportsmen\'s Club',
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
      description: 'End of summer competition'
    },
    {
      name: 'Fall Festival Shoot',
      location: 'Autumn Valley Range',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      description: 'Celebrating the fall season'
    },
    {
      name: 'Halloween Havoc',
      location: 'Spooky Hollow Range',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 2 weeks ago
      description: 'A frightfully fun competition'
    }
  ]

  // Define shooter progression profiles (base average -> target average)
  const shooterProfiles: Record<string, { trap: [number, number], skeet: [number, number], sporting: [number, number], fiveStand: [number, number] }> = {
    // These will be applied based on shooter position in their team
    improving: {
      trap: [70, 88],
      skeet: [65, 82],
      sporting: [60, 78],
      fiveStand: [62, 80]
    },
    steady: {
      trap: [80, 83],
      skeet: [78, 80],
      sporting: [75, 77],
      fiveStand: [76, 78]
    },
    declining: {
      trap: [85, 72],
      skeet: [82, 70],
      sporting: [80, 68],
      fiveStand: [81, 69]
    },
    beginner: {
      trap: [50, 75],
      skeet: [45, 68],
      sporting: [40, 65],
      fiveStand: [42, 67]
    }
  }

  const profileTypes = ['improving', 'steady', 'declining', 'beginner']

  // Create tournaments
  const createdTournaments: any[] = []
  
  for (const tournData of tournamentData) {
    // Check if tournament already exists
    let tournament = await prisma.tournament.findFirst({
      where: { name: tournData.name }
    })

    if (!tournament) {
      tournament = await prisma.tournament.create({
        data: {
          name: tournData.name,
          location: tournData.location,
          startDate: tournData.date,
          endDate: new Date(tournData.date.getTime() + 24 * 60 * 60 * 1000),
          description: tournData.description,
          status: 'completed',
          createdById: admin.id,
          enableHOA: true,
          enableHAA: true,
          hoaSeparateGender: false,
          haaCoreDisciplines: JSON.stringify([trap.id, skeet.id, sportingClays.id]),
          hoaExcludesHAA: true,
          haaExcludesDivision: true,
        }
      })

      // Add disciplines
      for (const discipline of [trap, skeet, sportingClays, fiveStand]) {
        await prisma.tournamentDiscipline.create({
          data: {
            tournamentId: tournament.id,
            disciplineId: discipline.id
          }
        })
      }

      console.log(`✅ Created tournament: ${tournament.name} (${tournData.date.toLocaleDateString()})`)
    } else {
      console.log(`✅ Found existing tournament: ${tournament.name}`)
    }

    createdTournaments.push(tournament)
  }

  console.log('\n📝 Creating shooter registrations and scores...\n')

  // For each team, register shooters and create progressive scores
  for (const team of teams) {
    console.log(`\n🏆 Processing team: ${team.name}`)
    
    for (let shooterIndex = 0; shooterIndex < team.shooters.length; shooterIndex++) {
      const shooter = team.shooters[shooterIndex]
      
      // Assign profile based on position (cyclic)
      const profileType = profileTypes[shooterIndex % profileTypes.length]
      const profile = shooterProfiles[profileType]
      
      console.log(`  👤 ${shooter.user.name} (${profileType} profile)`)

      // Generate score progressions for each discipline
      const trapScores = generateScoreProgression(profile.trap[0], profile.trap[1], tournamentData.length, 4)
      const skeetScores = generateScoreProgression(profile.skeet[0], profile.skeet[1], tournamentData.length, 4)
      const sportingScores = generateScoreProgression(profile.sporting[0], profile.sporting[1], tournamentData.length, 4)
      const fiveStandScores = generateScoreProgression(profile.fiveStand[0], profile.fiveStand[1], tournamentData.length, 4)

      // Register for each tournament and create shoots
      for (let i = 0; i < createdTournaments.length; i++) {
        const tournament = createdTournaments[i]

        // Check if already registered
        let registration = await prisma.registration.findFirst({
          where: {
            tournamentId: tournament.id,
            shooterId: shooter.id
          }
        })

        if (!registration) {
          registration = await prisma.registration.create({
            data: {
              tournamentId: tournament.id,
              shooterId: shooter.id,
              status: 'checked_in'
            }
          })

          // Add disciplines to the registration
          for (const discipline of [trap, skeet, sportingClays, fiveStand]) {
            await prisma.registrationDiscipline.create({
              data: {
                registrationId: registration.id,
                disciplineId: discipline.id
              }
            })
          }
        }

        // Create shoots for each discipline
        // Sporting clays must not exceed 100 targets total
        const disciplineData = [
          { discipline: trap, targetPercentage: trapScores[i], stations: 5, targetsPerStation: 5 },
          { discipline: skeet, targetPercentage: skeetScores[i], stations: 8, targetsPerStation: 3 },
          { discipline: sportingClays, targetPercentage: sportingScores[i], stations: 10, targetsPerStation: 10 }, // 100 targets max
          { discipline: fiveStand, targetPercentage: fiveStandScores[i], stations: 5, targetsPerStation: 5 }
        ]

        for (const { discipline, targetPercentage, stations, targetsPerStation } of disciplineData) {
          // Check if shoot already exists
          const existingShoot = await prisma.shoot.findFirst({
            where: {
              shooterId: shooter.id,
              tournamentId: tournament.id,
              disciplineId: discipline.id
            }
          })

          if (!existingShoot) {
            // Create shoot
            const shoot = await prisma.shoot.create({
              data: {
                shooterId: shooter.id,
                tournamentId: tournament.id,
                disciplineId: discipline.id,
                date: tournament.startDate
              }
            })

            // Generate and create station scores
            const stationScores = generateStationScores(stations, targetsPerStation, targetPercentage)
            
            for (let station = 0; station < stationScores.length; station++) {
              await prisma.score.create({
                data: {
                  shootId: shoot.id,
                  station: station + 1,
                  targets: stationScores[station],
                  totalTargets: targetsPerStation
                }
              })
            }
          }
        }
      }

      // Show progression summary
      console.log(`    📈 Trap: ${profile.trap[0].toFixed(1)}% → ${profile.trap[1].toFixed(1)}%`)
      console.log(`    📈 Skeet: ${profile.skeet[0].toFixed(1)}% → ${profile.skeet[1].toFixed(1)}%`)
      console.log(`    📈 Sporting: ${profile.sporting[0].toFixed(1)}% → ${profile.sporting[1].toFixed(1)}%`)
      console.log(`    📈 5-Stand: ${profile.fiveStand[0].toFixed(1)}% → ${profile.fiveStand[1].toFixed(1)}%`)
    }
  }

  console.log('\n✅ Tournament history seeding complete!')
  console.log(`\n📊 Summary:`)
  console.log(`   - ${createdTournaments.length} tournaments`)
  console.log(`   - ${teams.reduce((sum, t) => sum + t.shooters.length, 0)} shooters`)
  console.log(`   - ${createdTournaments.length * teams.reduce((sum, t) => sum + t.shooters.length, 0) * 4} shoots created`)
  console.log(`\n🎯 You can now view performance trends in Team History!\n`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

