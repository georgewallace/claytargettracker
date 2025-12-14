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

