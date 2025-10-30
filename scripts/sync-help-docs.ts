#!/usr/bin/env tsx
/**
 * Sync Help Documentation Script
 * 
 * This script reads user-facing markdown files and updates the HELP.md file
 * with the latest information. It consolidates documentation from multiple
 * sources into a single, comprehensive help guide.
 * 
 * Usage:
 *   npx tsx scripts/sync-help-docs.ts
 */

import fs from 'fs'
import path from 'path'

const ROOT_DIR = path.join(__dirname, '..')
const HELP_FILE = path.join(ROOT_DIR, 'HELP.md')

// User-facing documentation files to include
const USER_DOCS = [
  'QUICKSTART.md',
  'FEATURES.md',
  'DISCIPLINES_GUIDE.md',
  'SQUAD_MANAGEMENT_GUIDE.md',
  'SCHEDULE_MANAGEMENT_GUIDE.md',
  'SCORE_ENTRY.md',
  'TOURNAMENT_EDITING.md',
  'COACH_TEAM_MANAGEMENT.md',
]

interface Section {
  title: string
  content: string
  source: string
}

function readMarkdownFile(filename: string): string | null {
  const filePath = path.join(ROOT_DIR, filename)
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filename}`)
    return null
  }
  return fs.readFileSync(filePath, 'utf-8')
}

function extractSections(markdown: string, source: string): Section[] {
  const sections: Section[] = []
  const lines = markdown.split('\n')
  let currentSection: Section | null = null
  let currentContent: string[] = []

  for (const line of lines) {
    // Check for h2 headers (##)
    if (line.startsWith('## ')) {
      // Save previous section if exists
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim()
        sections.push(currentSection)
      }
      // Start new section
      currentSection = {
        title: line.replace('## ', '').trim(),
        content: '',
        source
      }
      currentContent = []
    } else if (currentSection) {
      currentContent.push(line)
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim()
    sections.push(currentSection)
  }

  return sections
}

function generateHelpMarkdown(allSections: Map<string, Section[]>): string {
  const helpContent: string[] = []

  // Header
  helpContent.push('# Clay Target Tracker - Help Guide')
  helpContent.push('')
  helpContent.push('Welcome to the Clay Target Tracker help system! This guide covers everything you need to know about using the application.')
  helpContent.push('')
  helpContent.push('> **Note**: This file is auto-generated. To update, modify the source documentation files and run `npm run help:sync`')
  helpContent.push('')
  helpContent.push('---')
  helpContent.push('')

  // Table of Contents
  helpContent.push('## Table of Contents')
  helpContent.push('')
  let tocIndex = 1
  for (const [source, sections] of allSections) {
    for (const section of sections) {
      const anchor = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      helpContent.push(`${tocIndex}. [${section.title}](#${anchor})`)
      tocIndex++
    }
  }
  helpContent.push('')
  helpContent.push('---')
  helpContent.push('')

  // Content sections
  for (const [source, sections] of allSections) {
    helpContent.push(`<!-- Source: ${source} -->`)
    helpContent.push('')
    for (const section of sections) {
      helpContent.push(`## ${section.title}`)
      helpContent.push('')
      helpContent.push(section.content)
      helpContent.push('')
      helpContent.push('---')
      helpContent.push('')
    }
  }

  // Footer
  helpContent.push('## Version Information')
  helpContent.push('')
  helpContent.push(`**Last Updated**: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`)
  helpContent.push('**Application Version**: 2.0')
  helpContent.push('')
  helpContent.push('---')
  helpContent.push('')
  helpContent.push('**Need more help?** Contact your system administrator or tournament organizer.')
  helpContent.push('')

  return helpContent.join('\n')
}

function main() {
  console.log('📚 Syncing Help Documentation...\n')

  const allSections = new Map<string, Section[]>()

  // Read and parse each documentation file
  for (const docFile of USER_DOCS) {
    console.log(`📖 Reading ${docFile}...`)
    const content = readMarkdownFile(docFile)
    if (content) {
      const sections = extractSections(content, docFile)
      if (sections.length > 0) {
        allSections.set(docFile, sections)
        console.log(`   ✅ Extracted ${sections.length} sections`)
      }
    }
  }

  console.log('')

  // Generate new HELP.md content
  console.log('📝 Generating HELP.md...')
  const helpMarkdown = generateHelpMarkdown(allSections)

  // Write to HELP.md
  fs.writeFileSync(HELP_FILE, helpMarkdown, 'utf-8')
  console.log(`   ✅ Written to ${HELP_FILE}`)

  console.log('')
  console.log('✨ Help documentation sync complete!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   - Source files processed: ${allSections.size}`)
  console.log(`   - Total sections: ${Array.from(allSections.values()).reduce((sum, sections) => sum + sections.length, 0)}`)
  console.log(`   - Output file: HELP.md`)
  console.log('')
  console.log('💡 Next steps:')
  console.log('   1. Review HELP.md for accuracy')
  console.log('   2. Commit changes to git')
  console.log('   3. The help page will automatically use the updated content')
}

// Run the script
try {
  main()
} catch (error) {
  console.error('❌ Error syncing help documentation:', error)
  process.exit(1)
}

