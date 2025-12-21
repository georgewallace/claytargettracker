const XLSX = require('xlsx')
const path = require('path')

// Read the Excel file
const filePath = path.join(__dirname, '..', 'Spring-Warmup-comprehensive-2025-12-21_v2.xlsx')
const workbook = XLSX.readFile(filePath)

console.log('Sheet Names:', workbook.SheetNames)
console.log('\n' + '='.repeat(80) + '\n')

// Get all sheet names
const sheetNames = workbook.SheetNames

// Group sheets by base name (e.g., "Teams" and "Team 2")
const sheetGroups = {}
sheetNames.forEach(name => {
  const baseName = name.replace(/ 2$/, '')
  if (!sheetGroups[baseName]) {
    sheetGroups[baseName] = {}
  }
  if (name.endsWith(' 2')) {
    sheetGroups[baseName].v2 = name
  } else {
    sheetGroups[baseName].v1 = name
  }
})

// Compare columns for each group
Object.keys(sheetGroups).forEach(baseName => {
  const group = sheetGroups[baseName]

  console.log(`\n${'='.repeat(80)}`)
  console.log(`COMPARING: "${baseName}"`)
  console.log('='.repeat(80))

  // Get columns from v1
  let v1Columns = []
  if (group.v1) {
    const sheet = workbook.Sheets[group.v1]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    v1Columns = data[0] || []
    console.log(`\n"${group.v1}" columns (${v1Columns.length}):`)
    v1Columns.forEach((col, idx) => console.log(`  ${idx + 1}. ${col}`))
  }

  // Get columns from v2
  let v2Columns = []
  if (group.v2) {
    const sheet = workbook.Sheets[group.v2]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })
    v2Columns = data[0] || []
    console.log(`\n"${group.v2}" columns (${v2Columns.length}):`)
    v2Columns.forEach((col, idx) => console.log(`  ${idx + 1}. ${col}`))
  }

  // Find new columns
  if (group.v1 && group.v2) {
    const newColumns = v2Columns.filter(col => !v1Columns.includes(col))
    const removedColumns = v1Columns.filter(col => !v2Columns.includes(col))

    console.log(`\n📝 NEW COLUMNS in "${group.v2}" (${newColumns.length}):`)
    if (newColumns.length > 0) {
      newColumns.forEach(col => console.log(`  ✓ ${col}`))
    } else {
      console.log('  (none)')
    }

    console.log(`\n📝 REMOVED COLUMNS from "${group.v1}" (${removedColumns.length}):`)
    if (removedColumns.length > 0) {
      removedColumns.forEach(col => console.log(`  ✗ ${col}`))
    } else {
      console.log('  (none)')
    }
  }

  console.log('\n')
})

console.log('\n' + '='.repeat(80))
console.log('ANALYSIS COMPLETE')
console.log('='.repeat(80))
