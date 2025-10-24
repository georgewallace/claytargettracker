import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding test data...')

  // Get existing disciplines
  const disciplines = await prisma.discipline.findMany()
  const trap = disciplines.find(d => d.name === 'trap')!
  const skeet = disciplines.find(d => d.name === 'skeet')!
  const sportingClays = disciplines.find(d => d.name === 'sporting_clays')!
  const fiveStand = disciplines.find(d => d.name === 'five_stand')!

  // Get or create West End Tournament
  let westEndTournament = await prisma.tournament.findFirst({
    where: { name: 'West End Tournament' }
  })

  if (!westEndTournament) {
    // Get an admin user to create the tournament
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' }
    })

    if (!admin) {
      console.log('❌ No admin user found. Please create an admin user first.')
      return
    }

    // Create West End Tournament
    westEndTournament = await prisma.tournament.create({
      data: {
        name: 'West End Tournament',
        location: 'West End Shooting Club',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-03'),
        description: 'Annual West End shooting tournament featuring all disciplines',
        status: 'active',
        createdById: admin.id,
      }
    })

    // Add all disciplines
    for (const discipline of disciplines) {
      await prisma.tournamentDiscipline.create({
        data: {
          tournamentId: westEndTournament.id,
          disciplineId: discipline.id,
        }
      })
    }

    console.log('✅ Created West End Tournament')
  } else {
    console.log('✅ Found West End Tournament:', westEndTournament.name)
  }

  // Update West End Tournament with HAA/HOA config
  await prisma.tournament.update({
    where: { id: westEndTournament.id },
    data: {
      enableHOA: true,
      enableHAA: true,
      hoaSeparateGender: false, // Can be toggled later
      haaCoreDisciplines: JSON.stringify([trap.id, skeet.id, sportingClays.id]),
      hoaExcludesHAA: true,
      haaExcludesDivision: true,
    }
  })

  console.log('✅ Updated tournament with HAA/HOA config')

  // Create Teams
  const teams = [
    { name: 'Thunder Ridge Shooting Club', coachEmail: 'coach.thompson@thunderridge.com', coachName: 'Sarah Thompson' },
    { name: 'Eagle Point Academy', coachEmail: 'coach.martinez@eaglepoint.com', coachName: 'Carlos Martinez' },
    { name: 'Riverside High School', coachEmail: 'coach.johnson@riverside.com', coachName: 'Mike Johnson' },
  ]

  const createdTeams: any[] = []

  for (const teamData of teams) {
    // Check if coach exists
    let coach = await prisma.user.findUnique({
      where: { email: teamData.coachEmail }
    })

    if (!coach) {
      // Create coach
      const hashedPassword = await bcrypt.hash('password123', 10)
      coach = await prisma.user.create({
        data: {
          email: teamData.coachEmail,
          name: teamData.coachName,
          password: hashedPassword,
          role: 'coach',
        }
      })
      console.log('✅ Created coach:', coach.name)
    }

    // Check if team exists
    let team = await prisma.team.findFirst({
      where: { name: teamData.name }
    })

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: teamData.name,
        }
      })
      console.log('✅ Created team:', team.name)
      
      // Add coach to team
      await prisma.teamCoach.create({
        data: {
          teamId: team.id,
          userId: coach.id,
          role: 'head_coach',
        }
      })
      console.log('✅ Added coach to team')
    }

    createdTeams.push(team)
  }

  // Create Shooters
  const shooters = [
    // Thunder Ridge (Team 0)
    { name: 'Emily Chen', email: 'emily.chen@test.com', gender: 'female', grade: '11', birthMonth: 3, birthYear: 2007, teamIdx: 0 },
    { name: 'Marcus Williams', email: 'marcus.williams@test.com', gender: 'male', grade: '12', birthMonth: 8, birthYear: 2006, teamIdx: 0 },
    { name: 'Sofia Rodriguez', email: 'sofia.rodriguez@test.com', gender: 'female', grade: '10', birthMonth: 11, birthYear: 2008, teamIdx: 0 },
    { name: 'James Anderson', email: 'james.anderson@test.com', gender: 'male', grade: '9', birthMonth: 5, birthYear: 2009, teamIdx: 0 },
    { name: 'Ava Thompson', email: 'ava.thompson@test.com', gender: 'female', grade: '11', birthMonth: 1, birthYear: 2007, teamIdx: 0 },
    
    // Eagle Point (Team 1)
    { name: 'Liam Foster', email: 'liam.foster@test.com', gender: 'male', grade: '12', birthMonth: 6, birthYear: 2006, teamIdx: 1 },
    { name: 'Isabella Martinez', email: 'isabella.martinez@test.com', gender: 'female', grade: '11', birthMonth: 9, birthYear: 2007, teamIdx: 1 },
    { name: 'Noah Bennett', email: 'noah.bennett@test.com', gender: 'male', grade: '10', birthMonth: 4, birthYear: 2008, teamIdx: 1 },
    { name: 'Emma Davis', email: 'emma.davis@test.com', gender: 'female', grade: '9', birthMonth: 12, birthYear: 2009, teamIdx: 1 },
    { name: 'Oliver Wilson', email: 'oliver.wilson@test.com', gender: 'male', grade: '11', birthMonth: 2, birthYear: 2007, teamIdx: 1 },
    
    // Riverside (Team 2)
    { name: 'Mia Johnson', email: 'mia.johnson@test.com', gender: 'female', grade: '12', birthMonth: 7, birthYear: 2006, teamIdx: 2 },
    { name: 'Ethan Brown', email: 'ethan.brown@test.com', gender: 'male', grade: '11', birthMonth: 10, birthYear: 2007, teamIdx: 2 },
    { name: 'Charlotte Lee', email: 'charlotte.lee@test.com', gender: 'female', grade: '10', birthMonth: 3, birthYear: 2008, teamIdx: 2 },
    { name: 'William Taylor', email: 'william.taylor@test.com', gender: 'male', grade: '9', birthMonth: 6, birthYear: 2009, teamIdx: 2 },
    { name: 'Amelia White', email: 'amelia.white@test.com', gender: 'female', grade: '11', birthMonth: 11, birthYear: 2007, teamIdx: 2 },
  ]

  const createdShooters: any[] = []

  for (const shooterData of shooters) {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: shooterData.email }
    })

    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10)
      user = await prisma.user.create({
        data: {
          email: shooterData.email,
          name: shooterData.name,
          password: hashedPassword,
          role: 'shooter',
        }
      })
    }

    // Check if shooter profile exists
    let shooter = await prisma.shooter.findUnique({
      where: { userId: user.id }
    })

    if (!shooter) {
      // Calculate division based on grade
      let division = 'Senior'
      if (shooterData.grade === '6' || shooterData.grade === '7') {
        division = 'Novice'
      } else if (shooterData.grade === '8') {
        division = 'Intermediate'
      } else if (shooterData.grade === '9' || shooterData.grade === '10') {
        division = 'Junior Varsity'
      }

      shooter = await prisma.shooter.create({
        data: {
          userId: user.id,
          teamId: createdTeams[shooterData.teamIdx].id,
          gender: shooterData.gender,
          birthMonth: shooterData.birthMonth,
          birthYear: shooterData.birthYear,
          grade: shooterData.grade,
          division,
          nscaClass: ['A', 'B', 'C', 'D', 'E'][Math.floor(Math.random() * 5)],
          ataClass: ['AA', 'A', 'B', 'C', 'D'][Math.floor(Math.random() * 5)],
        }
      })
      console.log('✅ Created shooter:', shooter)
    }

    createdShooters.push(shooter)
  }

  // Register shooters for West End Tournament
  for (const shooter of createdShooters) {
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        tournamentId_shooterId: {
          tournamentId: westEndTournament.id,
          shooterId: shooter.id,
        }
      }
    })

    if (!existingRegistration) {
      const registration = await prisma.registration.create({
        data: {
          tournamentId: westEndTournament.id,
          shooterId: shooter.id,
          status: 'registered',
        }
      })

      // Register for all disciplines
      for (const discipline of [trap, skeet, sportingClays]) {
        await prisma.registrationDiscipline.create({
          data: {
            registrationId: registration.id,
            disciplineId: discipline.id,
          }
        })
      }

      console.log('✅ Registered shooter:', shooter.id)
    }
  }

  // Get or create time slots for West End Tournament
  let timeSlots = await prisma.timeSlot.findMany({
    where: { tournamentId: westEndTournament.id },
    include: { discipline: true }
  })

  if (timeSlots.length === 0) {
    console.log('📅 Creating time slots...')
    const dates = [
      new Date('2025-11-01'),
      new Date('2025-11-02'),
      new Date('2025-11-03'),
    ]

    const times = [
      { start: '08:00', end: '10:00' },
      { start: '10:00', end: '12:00' },
      { start: '13:00', end: '15:00' },
      { start: '15:00', end: '17:00' },
    ]

    // Create time slots for each discipline, each day, each time slot
    for (const discipline of [trap, skeet, sportingClays]) {
      for (const date of dates) {
        for (let i = 0; i < times.length; i++) {
          const time = times[i]
          const isSkeetOrTrap = discipline.name === 'trap' || discipline.name === 'skeet'
          
          await prisma.timeSlot.create({
            data: {
              tournamentId: westEndTournament.id,
              disciplineId: discipline.id,
              date,
              startTime: time.start,
              endTime: time.end,
              squadCapacity: 5,
              fieldNumber: isSkeetOrTrap ? `Field ${i + 1}` : undefined,
              stationNumber: !isSkeetOrTrap ? `Station ${i + 1}` : undefined,
            }
          })
        }
      }
    }

    timeSlots = await prisma.timeSlot.findMany({
      where: { tournamentId: westEndTournament.id },
      include: { discipline: true }
    })

    console.log(`✅ Created ${timeSlots.length} time slots`)
  } else {
    console.log(`✅ Found ${timeSlots.length} time slots`)
  }

  // Create squads and assign shooters
  let squadCounter = 1
  for (const discipline of [trap, skeet, sportingClays]) {
    const disciplineTimeSlots = timeSlots.filter(ts => ts.disciplineId === discipline.id)
    
    if (disciplineTimeSlots.length === 0) {
      console.log(`⚠️  No time slots found for ${discipline.displayName}`)
      continue
    }

    // Group shooters by division
    const shootersByDivision: { [key: string]: any[] } = {}
    for (const shooter of createdShooters) {
      const division = shooter.division || 'No Division'
      if (!shootersByDivision[division]) {
        shootersByDivision[division] = []
      }
      shootersByDivision[division].push(shooter)
    }

    // Create squads for each division
    for (const [division, divisionShooters] of Object.entries(shootersByDivision)) {
      // Create squads of 5
      for (let i = 0; i < divisionShooters.length; i += 5) {
        const squadShooters = divisionShooters.slice(i, i + 5)
        const timeSlot = disciplineTimeSlots[Math.floor(Math.random() * disciplineTimeSlots.length)]

        const squad = await prisma.squad.create({
          data: {
            timeSlotId: timeSlot.id,
            name: `Squad ${squadCounter++}`,
            capacity: 5,
          }
        })

        // Add shooters to squad
        for (let j = 0; j < squadShooters.length; j++) {
          await prisma.squadMember.create({
            data: {
              squadId: squad.id,
              shooterId: squadShooters[j].id,
              position: j + 1,
            }
          })
        }

        console.log(`✅ Created ${discipline.displayName} squad with ${squadShooters.length} shooters from ${division}`)

        // Add scores for this squad
        for (const shooter of squadShooters) {
          const shoot = await prisma.shoot.upsert({
            where: {
              tournamentId_shooterId_disciplineId: {
                tournamentId: westEndTournament.id,
                shooterId: shooter.id,
                disciplineId: discipline.id,
              }
            },
            create: {
              tournamentId: westEndTournament.id,
              shooterId: shooter.id,
              disciplineId: discipline.id,
              date: new Date(),
            },
            update: {}
          })

          // Generate random scores based on discipline
          if (discipline.name === 'trap' || discipline.name === 'skeet') {
            // 4 rounds of 25
            for (let round = 1; round <= 4; round++) {
              await prisma.score.upsert({
                where: {
                  shootId_station: {
                    shootId: shoot.id,
                    station: round,
                  }
                },
                create: {
                  shootId: shoot.id,
                  station: round,
                  targets: Math.floor(Math.random() * 6) + 20, // 20-25 targets
                  totalTargets: 25,
                },
                update: {}
              })
            }
          } else if (discipline.name === 'sporting_clays') {
            // 14 stations of 10
            for (let station = 1; station <= 14; station++) {
              await prisma.score.upsert({
                where: {
                  shootId_station: {
                    shootId: shoot.id,
                    station,
                  }
                },
                create: {
                  shootId: shoot.id,
                  station,
                  targets: Math.floor(Math.random() * 3) + 8, // 8-10 targets
                  totalTargets: 10,
                },
                update: {}
              })
            }
          }

          console.log(`✅ Added scores for shooter ${shooter.id} in ${discipline.displayName}`)
        }
      }
    }
  }

  console.log('🎉 Test data seeded successfully!')
}

main()
  .catch(e => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

