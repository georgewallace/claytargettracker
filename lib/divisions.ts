// Calculate division based on grade
export function calculateDivision(grade: string | null | undefined): string | null {
  if (!grade) return null
  
  const gradeNum = grade.toLowerCase()
  
  // Novice: 6th grade and below
  if (['k', 'kindergarten', '1', '2', '3', '4', '5', '6'].includes(gradeNum)) {
    return 'Novice'
  }
  
  // Intermediate: 7th – 8th grade
  if (['7', '8'].includes(gradeNum)) {
    return 'Intermediate'
  }
  
  // Junior Varsity: 9th grade
  if (gradeNum === '9') {
    return 'Junior Varsity'
  }
  
  // Varsity: 10th – 12th grade
  if (['10', '11', '12'].includes(gradeNum)) {
    return 'Varsity'
  }

  // Collegiate: College/Trade School
  if (['college', 'trade', 'university', 'college-trade'].includes(gradeNum)) {
    return 'Collegiate'
  }
  
  return null
}

// Get all available grade options
export const gradeOptions = [
  { value: 'K', label: 'Kindergarten' },
  { value: '1', label: '1st Grade' },
  { value: '2', label: '2nd Grade' },
  { value: '3', label: '3rd Grade' },
  { value: '4', label: '4th Grade' },
  { value: '5', label: '5th Grade' },
  { value: '6', label: '6th Grade' },
  { value: '7', label: '7th Grade' },
  { value: '8', label: '8th Grade' },
  { value: '9', label: '9th Grade' },
  { value: '10', label: '10th Grade' },
  { value: '11', label: '11th Grade' },
  { value: '12', label: '12th Grade' },
  { value: 'College', label: 'College-Trade School' }
]

// Month options
export const monthOptions = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

// Generate year options (current year down to 100 years ago)
export function getYearOptions() {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= currentYear - 100; year--) {
    years.push({ value: year, label: year.toString() })
  }
  return years
}

// Generate day options based on month and year (to handle varying days per month)
export function getDayOptions(month?: number | null, year?: number | null) {
  // Default to 31 days if month/year not selected
  let daysInMonth = 31

  if (month && year) {
    // Use JavaScript Date to get actual days in month
    daysInMonth = new Date(year, month, 0).getDate()
  } else if (month) {
    // Approximate based on month only
    const daysPerMonth: Record<number, number> = {
      1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
      7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
    }
    daysInMonth = daysPerMonth[month] || 31
  }

  const days = []
  for (let day = 1; day <= daysInMonth; day++) {
    days.push({ value: day, label: day.toString() })
  }
  return days
}

// All available division options
export const divisionOptions = [
  { value: 'Novice', label: 'Novice' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Junior Varsity', label: 'Junior Varsity' },
  { value: 'Varsity', label: 'Varsity' },
  { value: 'Collegiate', label: 'Collegiate' },
  { value: 'Open', label: 'Open' },
  { value: 'Unassigned', label: 'Unassigned' }
]

// Team affiliation options
export const affiliationOptions = [
  { value: 'USAYESS', label: 'USAYESS' },
  { value: 'SCTP', label: 'SCTP' },
  { value: 'High School', label: 'High School Clay Target Team' },
  { value: 'Other', label: 'Other' }
]

// Get the effective division (override takes precedence over calculated)
export function getEffectiveDivision(
  calculatedDivision: string | null,
  divisionOverride: string | null
): string | null {
  return divisionOverride || calculatedDivision
}

// Predefined squad names (Division + Number format)
export const squadNameOptions = [
  // Collegiate squads
  { value: 'Collegiate 1', label: 'Collegiate 1', division: 'Collegiate' },
  { value: 'Collegiate 2', label: 'Collegiate 2', division: 'Collegiate' },
  { value: 'Collegiate 3', label: 'Collegiate 3', division: 'Collegiate' },

  // Intermediate squads
  { value: 'Intermediate 1', label: 'Intermediate 1', division: 'Intermediate' },
  { value: 'Intermediate 2', label: 'Intermediate 2', division: 'Intermediate' },
  { value: 'Intermediate 3', label: 'Intermediate 3', division: 'Intermediate' },

  // Junior Varsity squads
  { value: 'Junior Varsity 1', label: 'Junior Varsity 1', division: 'Junior Varsity' },
  { value: 'Junior Varsity 2', label: 'Junior Varsity 2', division: 'Junior Varsity' },
  { value: 'Junior Varsity 3', label: 'Junior Varsity 3', division: 'Junior Varsity' },

  // Novice squads
  { value: 'Novice 1', label: 'Novice 1', division: 'Novice' },
  { value: 'Novice 2', label: 'Novice 2', division: 'Novice' },
  { value: 'Novice 3', label: 'Novice 3', division: 'Novice' },

  // Open squads
  { value: 'Open 1', label: 'Open 1', division: 'Open' },
  { value: 'Open 2', label: 'Open 2', division: 'Open' },
  { value: 'Open 3', label: 'Open 3', division: 'Open' },

  // Unassigned squads
  { value: 'Unassigned 1', label: 'Unassigned 1', division: 'Unassigned' },
  { value: 'Unassigned 2', label: 'Unassigned 2', division: 'Unassigned' },
  { value: 'Unassigned 3', label: 'Unassigned 3', division: 'Unassigned' },

  // Varsity squads
  { value: 'Varsity 1', label: 'Varsity 1', division: 'Varsity' },
  { value: 'Varsity 2', label: 'Varsity 2', division: 'Varsity' },
  { value: 'Varsity 3', label: 'Varsity 3', division: 'Varsity' },
]

// Get squad names filtered by division
export function getSquadNamesByDivision(division: string | null): typeof squadNameOptions {
  if (!division) return squadNameOptions
  return squadNameOptions.filter(squad => squad.division === division)
}

