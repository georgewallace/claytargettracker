const XLSX = require('xlsx');

// Create Athletes Import Template
function createAthletesTemplate() {
  const athleteData = [
    // Header row is defined by the keys
    {
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john.doe@example.com',
      'Team': 'Thunder Ridge Shooting Club',
      'Grade': '10',
      'Gender': 'male',
      'NSCA Class': 'A',
      'ATA Class': 'AA',
      'NSSA Class': 'B'
    },
    {
      'First Name': 'Jane',
      'Last Name': 'Smith',
      'Email': 'jane.smith@example.com',
      'Team': 'Thunder Ridge Shooting Club',
      'Grade': '11',
      'Gender': 'female',
      'NSCA Class': 'AA',
      'ATA Class': 'A',
      'NSSA Class': 'A'
    },
    {
      'First Name': 'Mike',
      'Last Name': 'Johnson',
      'Email': '', // Email is optional
      'Team': 'Eagle Point Academy',
      'Grade': '9',
      'Gender': 'male',
      'NSCA Class': 'B',
      'ATA Class': 'A',
      'NSSA Class': 'C'
    },
    {
      'First Name': 'Sarah',
      'Last Name': 'Williams',
      'Email': 'sarah.w@example.com',
      'Team': 'Riverside High School',
      'Grade': '12',
      'Gender': 'female',
      'NSCA Class': 'AAA',
      'ATA Class': 'AA',
      'NSSA Class': 'AA'
    },
    {
      'First Name': 'David',
      'Last Name': 'Brown',
      'Email': '',
      'Team': 'Eagle Point Academy',
      'Grade': '7',
      'Gender': 'male',
      'NSCA Class': 'D',
      'ATA Class': '',
      'NSSA Class': 'E'
    },
    {
      'First Name': 'Emily',
      'Last Name': 'Davis',
      'Email': 'emily.davis@example.com',
      'Team': 'Thunder Ridge Shooting Club',
      'Grade': 'College',
      'Gender': 'female',
      'NSCA Class': 'AA',
      'ATA Class': 'A',
      'NSSA Class': 'A'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(athleteData);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 25 }, // Email
    { wch: 30 }, // Team
    { wch: 10 }, // Grade
    { wch: 10 }, // Gender
    { wch: 12 }, // NSCA Class
    { wch: 12 }, // ATA Class
    { wch: 12 }, // NSSA Class
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Athletes');
  XLSX.writeFile(wb, 'Athletes_Import_Template.xlsx');
  console.log('✅ Created: Athletes_Import_Template.xlsx');
}

// Create Coaches Import Template
function createCoachesTemplate() {
  const coachData = [
    {
      'First Name': 'Robert',
      'Last Name': 'Anderson',
      'Email': 'robert.anderson@example.com',
      'Team': 'Thunder Ridge Shooting Club'
    },
    {
      'First Name': 'Lisa',
      'Last Name': 'Martinez',
      'Email': 'lisa.martinez@example.com',
      'Team': 'Eagle Point Academy'
    },
    {
      'First Name': 'James',
      'Last Name': 'Wilson',
      'Email': '', // Email is optional - will create placeholder
      'Team': 'Riverside High School'
    },
    {
      'First Name': 'Jennifer',
      'Last Name': 'Taylor',
      'Email': 'jen.taylor@example.com',
      'Team': 'Thunder Ridge Shooting Club'
    },
    {
      'First Name': 'Michael',
      'Last Name': 'Lee',
      'Email': 'michael.lee@example.com',
      'Team': 'Eagle Point Academy'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(coachData);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 30 }, // Email
    { wch: 30 }, // Team
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Coaches');
  XLSX.writeFile(wb, 'Coaches_Import_Template.xlsx');
  console.log('✅ Created: Coaches_Import_Template.xlsx');
}

// Create comprehensive example with more data
function createComprehensiveExample() {
  const teams = [
    'Thunder Ridge Shooting Club',
    'Eagle Point Academy',
    'Riverside High School',
    'School of Hard Knocks',
    'Bearded Vultures'
  ];

  const firstNames = {
    male: ['John', 'Mike', 'David', 'James', 'Robert', 'William', 'Richard', 'Thomas', 'Christopher', 'Daniel'],
    female: ['Jane', 'Sarah', 'Emily', 'Lisa', 'Jennifer', 'Jessica', 'Ashley', 'Amanda', 'Melissa', 'Michelle']
  };

  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                     'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  const grades = ['6', '7', '8', '9', '10', '11', '12', 'College'];
  const nscaClasses = ['E', 'D', 'C', 'B', 'A', 'AA', 'AAA'];
  const ataClasses = ['A', 'AA', 'AAA'];
  const nssaClasses = ['E', 'D', 'C', 'B', 'A', 'AA', 'AAA'];

  const athletes = [];

  // Generate 30 sample athletes
  for (let i = 0; i < 30; i++) {
    const gender = i % 2 === 0 ? 'male' : 'female';
    const firstName = firstNames[gender][i % firstNames[gender].length];
    const lastName = lastNames[i % lastNames.length];
    const team = teams[i % teams.length];
    const grade = grades[i % grades.length];

    athletes.push({
      'First Name': firstName,
      'Last Name': `${lastName}${i > 9 ? i : ''}`, // Add number to make unique
      'Email': i % 3 === 0 ? '' : `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 9 ? i : ''}@example.com`,
      'Team': team,
      'Grade': grade,
      'Gender': gender,
      'NSCA Class': nscaClasses[i % nscaClasses.length],
      'ATA Class': ataClasses[i % ataClasses.length],
      'NSSA Class': nssaClasses[i % nssaClasses.length]
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(athletes);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 35 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Athletes');
  XLSX.writeFile(wb, 'Athletes_Import_Example_30.xlsx');
  console.log('✅ Created: Athletes_Import_Example_30.xlsx (30 sample athletes)');
}

// Run all
console.log('Creating import template files...\n');
createAthletesTemplate();
createCoachesTemplate();
createComprehensiveExample();
console.log('\n✨ All template files created successfully!');
console.log('\nUsage:');
console.log('1. Open the template file in Excel');
console.log('2. Replace sample data with your actual data');
console.log('3. Go to Admin Dashboard in the app');
console.log('4. Click "Bulk Import Athletes" or "Bulk Import Coaches"');
console.log('5. Upload your filled template file');
