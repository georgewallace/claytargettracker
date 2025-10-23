const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

const sampleShooters = [
  { name: 'John Smith', email: 'john.smith@example.com' },
  { name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
  { name: 'Michael Brown', email: 'michael.brown@example.com' },
  { name: 'Emily Davis', email: 'emily.davis@example.com' },
  { name: 'Robert Wilson', email: 'robert.wilson@example.com' },
  { name: 'Jessica Martinez', email: 'jessica.martinez@example.com' },
  { name: 'David Anderson', email: 'david.anderson@example.com' },
  { name: 'Ashley Taylor', email: 'ashley.taylor@example.com' },
  { name: 'Christopher Lee', email: 'christopher.lee@example.com' },
  { name: 'Amanda White', email: 'amanda.white@example.com' },
]

async function main() {
  console.log('Creating sample shooter accounts...\n')
  
  const password = await bcrypt.hash('password123', 10)
  let created = 0
  let skipped = 0

  for (const shooter of sampleShooters) {
    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: shooter.email }
      })

      if (existing) {
        console.log(`⏭️  Skipped: ${shooter.name} (already exists)`)
        skipped++
        continue
      }

      // Create user with shooter profile
      const user = await prisma.user.create({
        data: {
          email: shooter.email,
          name: shooter.name,
          password: password,
          role: 'shooter',
          shooter: {
            create: {}
          }
        },
        include: {
          shooter: true
        }
      })

      console.log(`✅ Created: ${user.name} (${user.email})`)
      created++
    } catch (error) {
      console.error(`❌ Error creating ${shooter.name}:`, error.message)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Created: ${created} shooters`)
  console.log(`   ⏭️  Skipped: ${skipped} shooters (already existed)`)
  console.log(`   📧 Default password: password123`)
  console.log(`\n🎯 You can now add these shooters to your RMCB team!`)
  console.log(`   Go to: http://localhost:3000/teams/my-team`)
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

