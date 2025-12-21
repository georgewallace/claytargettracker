const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function populateTestTourney() {
  try {
    console.log('Finding Test tourney...\n')

    // Find Test tourney
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'Test tourney'
        }
      },
      include: {
        disciplines: {
          include: {
            discipline: true
          }
        }
      }
    })

    if (!tournament) {
      console.log('❌ Test tourney not found')
      return
    }

    console.log(`✓ Found tournament: ${tournament.name} (ID: ${tournament.id})\n`)

    // Clean up any existing test data
    console.log('Cleaning up existing test data...\n')

    // Delete test teams (this will cascade delete athletes, registrations, etc.)
    await prisma.team.deleteMany({
      where: {
        OR: [
          { name: { contains: 'Eagle Ridge' } },
          { name: { contains: 'Valley View' } }
        ]
      }
    })

    // Delete test users
    await prisma.user.deleteMany({
      where: {
        email: {
          endsWith: '@test.com'
        }
      }
    })

    console.log('✓ Cleanup complete\n')

    // Get available disciplines
    const skeetDiscipline = tournament.disciplines.find(d => d.discipline.name === 'skeet')
    const trapDiscipline = tournament.disciplines.find(d => d.discipline.name === 'trap')
    const sportingClaysDiscipline = tournament.disciplines.find(d => d.discipline.name === 'sporting_clays')

    console.log('Available disciplines:',
      [skeetDiscipline, trapDiscipline, sportingClaysDiscipline].filter(Boolean).map(d => d.discipline.displayName).join(', '))
    console.log('\n')

    // Create test teams with new fields
    console.log('Creating test teams...\n')

    const team1 = await prisma.team.create({
      data: {
        name: 'Eagle Ridge Shooting Club',
        affiliation: 'USAYESS',
        headCoach: 'John Anderson',
        headCoachEmail: 'john.anderson@eagleridge.com',
        headCoachPhone: '(555) 123-4567',
        address: '123 Shooting Range Rd',
        city: 'Springfield',
        state: 'IL',
        zip: '62701'
      }
    })
    console.log(`✓ Created team: ${team1.name}`)

    const team2 = await prisma.team.create({
      data: {
        name: 'Valley View Clay Target Team',
        affiliation: 'SCTP',
        headCoach: 'Sarah Mitchell',
        headCoachEmail: 'sarah.mitchell@valleyview.org',
        headCoachPhone: '(555) 987-6543',
        address: '456 Target Lane',
        city: 'Riverdale',
        state: 'CA',
        zip: '95818'
      }
    })
    console.log(`✓ Created team: ${team2.name}`)

    // Get a user to use as registeredBy (use an existing user)
    const registrar = await prisma.user.findFirst({
      where: { role: { in: ['admin', 'coach'] } }
    })

    if (!registrar) {
      console.log('❌ No admin/coach user found to register teams')
      return
    }

    // Register teams for tournament
    await prisma.teamTournamentRegistration.create({
      data: {
        tournamentId: tournament.id,
        teamId: team1.id,
        registeredBy: registrar.id
      }
    })
    await prisma.teamTournamentRegistration.create({
      data: {
        tournamentId: tournament.id,
        teamId: team2.id,
        registeredBy: registrar.id
      }
    })
    console.log('✓ Registered teams for tournament\n')

    // Create test users/athletes with new fields
    console.log('Creating test athletes...\n')

    const athletes = [
      {
        firstName: 'Emma',
        lastName: 'Rodriguez',
        email: 'emma.rodriguez@test.com',
        phone: '(555) 111-2222',
        gender: 'female',
        grade: 'sophomore',
        birthMonth: 3,
        birthDay: 15,
        birthYear: 2008,
        teamId: team1.id,
        disciplines: [skeetDiscipline?.disciplineId, trapDiscipline?.disciplineId].filter(Boolean)
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@test.com',
        phone: '(555) 333-4444',
        gender: 'male',
        grade: 'junior',
        birthMonth: 7,
        birthDay: 22,
        birthYear: 2007,
        teamId: team1.id,
        disciplines: [trapDiscipline?.disciplineId, sportingClaysDiscipline?.disciplineId].filter(Boolean)
      },
      {
        firstName: 'Sophia',
        lastName: 'Williams',
        email: 'sophia.williams@test.com',
        phone: '(555) 555-6666',
        gender: 'female',
        grade: 'senior',
        birthMonth: 11,
        birthDay: 8,
        birthYear: 2006,
        teamId: team2.id,
        disciplines: [skeetDiscipline?.disciplineId, sportingClaysDiscipline?.disciplineId].filter(Boolean)
      },
      {
        firstName: 'James',
        lastName: 'Thompson',
        email: 'james.thompson@test.com',
        phone: '(555) 777-8888',
        gender: 'male',
        grade: '7th',
        birthMonth: 5,
        birthDay: 30,
        birthYear: 2010,
        teamId: team2.id,
        disciplines: [skeetDiscipline?.disciplineId].filter(Boolean)
      },
      {
        firstName: 'Isabella',
        lastName: 'Martinez',
        email: 'isabella.martinez@test.com',
        phone: '(555) 999-0000',
        gender: 'female',
        grade: 'freshman',
        birthMonth: 9,
        birthDay: 12,
        birthYear: 2009,
        teamId: team1.id,
        disciplines: [trapDiscipline?.disciplineId].filter(Boolean)
      }
    ]

    const createdAthletes = []

    for (const athleteData of athletes) {
      // Calculate division based on grade
      let division = ''
      if (athleteData.grade === '5th' || athleteData.grade === '6th') {
        division = 'Novice'
      } else if (athleteData.grade === '7th' || athleteData.grade === '8th') {
        division = 'Intermediate'
      } else if (athleteData.grade === 'freshman') {
        division = 'Junior Varsity'
      } else if (athleteData.grade === 'sophomore' || athleteData.grade === 'junior' || athleteData.grade === 'senior') {
        division = 'Varsity'
      }

      // Generate shooter ID
      const year = new Date().getFullYear().toString().slice(-2)
      const lastShooter = await prisma.athlete.findFirst({
        where: { shooterId: { startsWith: `${year}-` } },
        orderBy: { shooterId: 'desc' }
      })
      const nextNumber = lastShooter ? parseInt(lastShooter.shooterId.split('-')[1]) + 1 : 1000
      const shooterId = `${year}-${nextNumber}`

      // Create user
      const user = await prisma.user.create({
        data: {
          email: athleteData.email,
          name: `${athleteData.firstName} ${athleteData.lastName}`,
          firstName: athleteData.firstName,
          lastName: athleteData.lastName,
          phone: athleteData.phone,
          password: 'hashedpassword123', // Placeholder
          role: 'athlete'
        }
      })

      // Create athlete
      const athlete = await prisma.athlete.create({
        data: {
          userId: user.id,
          teamId: athleteData.teamId,
          shooterId,
          gender: athleteData.gender,
          grade: athleteData.grade,
          division,
          birthMonth: athleteData.birthMonth,
          birthDay: athleteData.birthDay,
          birthYear: athleteData.birthYear,
          nscaClass: ['A', 'AA', 'AAA'][Math.floor(Math.random() * 3)],
          ataClass: ['A', 'AA', 'AAA'][Math.floor(Math.random() * 3)],
          nssaClass: ['B', 'A', 'AA'][Math.floor(Math.random() * 3)]
        }
      })

      // Create registration
      const registration = await prisma.registration.create({
        data: {
          tournamentId: tournament.id,
          athleteId: athlete.id
        }
      })

      // Register for disciplines
      for (const disciplineId of athleteData.disciplines) {
        await prisma.registrationDiscipline.create({
          data: {
            registrationId: registration.id,
            disciplineId
          }
        })
      }

      createdAthletes.push({ user, athlete, registration })
      console.log(`✓ Created: ${athleteData.firstName} ${athleteData.lastName} (${shooterId}) - ${division}`)
    }

    console.log(`\n✓ Created ${createdAthletes.length} athletes\n`)

    // Create time slots and squads for testing
    console.log('Creating time slots and squads...\n')

    if (skeetDiscipline) {
      const timeSlot = await prisma.timeSlot.create({
        data: {
          tournamentId: tournament.id,
          disciplineId: skeetDiscipline.disciplineId,
          date: new Date(tournament.startDate),
          startTime: '09:00',
          endTime: '11:00',
          fieldNumber: 'Field 1',
          squadCapacity: 5
        }
      })

      const squad = await prisma.squad.create({
        data: {
          timeSlotId: timeSlot.id,
          name: 'Squad A1'
        }
      })

      // Assign athletes to squad
      const skeetAthletes = createdAthletes.filter(a =>
        a.registration && athletes.find(ad =>
          ad.email === a.user.email &&
          ad.disciplines.includes(skeetDiscipline.disciplineId)
        )
      )

      for (let i = 0; i < Math.min(skeetAthletes.length, 5); i++) {
        await prisma.squadMember.create({
          data: {
            squadId: squad.id,
            athleteId: skeetAthletes[i].athlete.id,
            position: i + 1
          }
        })
      }

      console.log(`✓ Created Skeet squad with ${Math.min(skeetAthletes.length, 5)} members`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Test tourney populated successfully!')
    console.log('='.repeat(60))
    console.log(`\nYou can now test the export at:`)
    console.log(`/tournaments/${tournament.id}/export-comprehensive`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Error populating test tourney:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateTestTourney()
