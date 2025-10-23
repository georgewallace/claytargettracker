/**
 * Utility functions for time slot management
 */

export interface TimeSlotConfig {
  date: Date
  startTime: string // "HH:MM" format (24-hour)
  endTime: string // "HH:MM" format (24-hour)
  slotDuration: number // minutes
  squadCapacity: number
  disciplineId: string
  fieldNumber?: string
  stationNumber?: string
}

export interface TimeSlot {
  date: Date
  startTime: string
  endTime: string
  squadCapacity: number
  disciplineId: string
  fieldNumber?: string
  stationNumber?: string
}

/**
 * Parse time string to minutes since midnight
 */
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Format minutes since midnight to HH:MM string
 */
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

/**
 * Generate time slots based on configuration
 */
export function generateTimeSlots(config: TimeSlotConfig): TimeSlot[] {
  const slots: TimeSlot[] = []
  
  const startMinutes = parseTime(config.startTime)
  const endMinutes = parseTime(config.endTime)
  
  let currentMinutes = startMinutes
  
  while (currentMinutes < endMinutes) {
    const slotEndMinutes = currentMinutes + config.slotDuration
    
    // Only add slot if it fits completely within the time range
    if (slotEndMinutes <= endMinutes) {
      slots.push({
        date: config.date,
        startTime: formatTime(currentMinutes),
        endTime: formatTime(slotEndMinutes),
        squadCapacity: config.squadCapacity,
        disciplineId: config.disciplineId,
        fieldNumber: config.fieldNumber,
        stationNumber: config.stationNumber
      })
    }
    
    currentMinutes = slotEndMinutes
  }
  
  return slots
}

/**
 * Format time range for display
 */
export function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end}`
}

/**
 * Get hour options for time picker (on hour and half-hour)
 */
export function getTimeOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []
  
  for (let hour = 0; hour < 24; hour++) {
    // On the hour
    const hourStr = String(hour).padStart(2, '0')
    options.push({
      value: `${hourStr}:00`,
      label: `${hourStr}:00`
    })
    
    // Half past
    options.push({
      value: `${hourStr}:30`,
      label: `${hourStr}:30`
    })
  }
  
  return options
}

/**
 * Validate time slot
 */
export function validateTimeSlot(slot: Partial<TimeSlot>): { valid: boolean; error?: string } {
  if (!slot.startTime || !slot.endTime) {
    return { valid: false, error: 'Start and end times are required' }
  }
  
  const startMinutes = parseTime(slot.startTime)
  const endMinutes = parseTime(slot.endTime)
  
  if (endMinutes <= startMinutes) {
    return { valid: false, error: 'End time must be after start time' }
  }
  
  const duration = endMinutes - startMinutes
  if (duration < 30) {
    return { valid: false, error: 'Time slot must be at least 30 minutes' }
  }
  
  if (!slot.squadCapacity || slot.squadCapacity < 1) {
    return { valid: false, error: 'Squad capacity must be at least 1' }
  }
  
  return { valid: true }
}

/**
 * Get date range between start and end dates
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  const end = new Date(endDate)
  
  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Check if time slot overlaps with existing slots
 */
export function hasTimeOverlap(
  newSlot: { startTime: string; endTime: string },
  existingSlots: Array<{ startTime: string; endTime: string }>
): boolean {
  const newStart = parseTime(newSlot.startTime)
  const newEnd = parseTime(newSlot.endTime)
  
  return existingSlots.some(slot => {
    const existingStart = parseTime(slot.startTime)
    const existingEnd = parseTime(slot.endTime)
    
    // Check for any overlap
    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    )
  })
}

