import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: '.env.local' })

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.STAGING_DATABASE_URL }
  }
})

async function test() {
  try {
    console.log('🔍 Testing staging database connection...')
    const userCount = await prisma.user.count()
    console.log(`✅ Connection successful!`)
    console.log(`📊 Found ${userCount} users in staging database`)
    
    const tournamentCount = await prisma.tournament.count()
    console.log(`📊 Found ${tournamentCount} tournaments in staging database`)
    
    await prisma.$disconnect()
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

test()

