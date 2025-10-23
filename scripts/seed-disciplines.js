const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const disciplines = [
  {
    name: 'sporting_clays',
    displayName: 'Sporting Clays',
    description: 'A challenging and varied discipline with stations simulating different field scenarios'
  },
  {
    name: 'five_stand',
    displayName: '5-Stand',
    description: 'Five shooting stations with targets thrown from various machines'
  },
  {
    name: 'skeet',
    displayName: 'Skeet',
    description: 'Classic discipline with high and low houses, 8 stations in a semicircle'
  },
  {
    name: 'trap',
    displayName: 'Trap',
    description: 'Targets thrown away from the shooter at various angles'
  }
]

async function main() {
  console.log('Seeding disciplines...\n')
  
  for (const discipline of disciplines) {
    const existing = await prisma.discipline.findUnique({
      where: { name: discipline.name }
    })

    if (existing) {
      console.log(`⏭️  Skipped: ${discipline.displayName} (already exists)`)
      continue
    }

    const created = await prisma.discipline.create({
      data: discipline
    })

    console.log(`✅ Created: ${created.displayName}`)
  }

  console.log('\n✅ Disciplines seeded successfully!')
  console.log('\nAvailable disciplines:')
  const all = await prisma.discipline.findMany()
  all.forEach(d => {
    console.log(`   - ${d.displayName} (${d.name})`)
  })
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

