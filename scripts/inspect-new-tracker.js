const XLSX = require('xlsx');

// Read the new tournament tracker file
const workbook = XLSX.readFile('/Users/georgewallace/elastic-repos/claytargettracker/TournamentTracker-new.xlsx');

console.log('📋 Available sheets:', workbook.SheetNames);
console.log('\n');

// Check if Shooter History sheet exists
if (workbook.SheetNames.includes('Shooter History')) {
  const sheet = workbook.Sheets['Shooter History'];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log('✅ Found "Shooter History" sheet');
  console.log(`   Total rows: ${data.length}`);
  console.log('\n📊 First 3 rows:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));

  if (data.length > 0) {
    console.log('\n🔑 Column headers:');
    console.log(Object.keys(data[0]));
  }
} else {
  console.log('❌ "Shooter History" sheet not found');
}
