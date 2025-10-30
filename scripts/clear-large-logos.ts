import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearLargeLogos() {
  try {
    console.log('🔍 Finding teams with base64 logos...')
    
    const teams = await prisma.team.findMany({
      where: {
        logoUrl: {
          startsWith: 'data:'
        }
      }
    })
    
    if (teams.length === 0) {
      console.log('✅ No teams with base64 logos found.')
      return
    }
    
    console.log(`Found ${teams.length} team(s) with base64 logos:`)
    teams.forEach(team => {
      const logoSize = team.logoUrl?.length || 0
      const sizeKB = (logoSize / 1024).toFixed(2)
      console.log(`  - ${team.name}: ${sizeKB} KB (base64 length: ${logoSize})`)
    })
    
    console.log('\n🗑️  Clearing logos...')
    
    const result = await prisma.team.updateMany({
      where: {
        logoUrl: {
          startsWith: 'data:'
        }
      },
      data: {
        logoUrl: null
      }
    })
    
    console.log(`✅ Cleared ${result.count} team logo(s)`)
    console.log('\n📝 Next steps:')
    console.log('   1. Re-upload team logos with smaller file sizes (max 500KB)')
    console.log('   2. Tip: Compress images at https://tinypng.com before uploading')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearLargeLogos()

