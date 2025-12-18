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
 * Get hour options for time picker (15-minute increments)
 */
export function getTimeOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = []

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = String(hour).padStart(2, '0')
      const minStr = String(minute).padStart(2, '0')
      options.push({
        value: `${hourStr}:${minStr}`,
        label: `${hourStr}:${minStr}`
      })
    }
  }

  return options
}

/**
 * Get duration options in 15-minute increments
 * Returns durations from 15 minutes to 4 hours (240 minutes)
 */
export function getDurationOptions(): Array<{ value: number; label: string }> {
  const options: Array<{ value: number; label: string }> = []

  // Generate options from 15 minutes to 4 hours in 15-minute increments
  for (let minutes = 15; minutes <= 240; minutes += 15) {
    options.push({
      value: minutes,
      label: formatDuration(minutes)
    })
  }

  return options
}

/**
 * Format duration in minutes to human-readable string
 * Examples: "15 min", "1h", "1h 15min", "2h 30min"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) {
    return `${mins} min`
  } else if (mins === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${mins}min`
  }
}

/**
 * Calculate duration in minutes between two times
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = parseTime(startTime)
  const endMinutes = parseTime(endTime)
  return endMinutes - startMinutes
}

/**
 * Calculate end time based on start time and duration
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const startMinutes = parseTime(startTime)
  const endMinutes = startMinutes + durationMinutes

  // Handle times that go past midnight
  const normalizedMinutes = endMinutes % (24 * 60)
  return formatTime(normalizedMinutes)
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

