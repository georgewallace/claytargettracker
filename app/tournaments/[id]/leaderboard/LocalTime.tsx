'use client'

export function LocalTime({ isoString }: { isoString: string }) {
  return <>{new Date(isoString).toLocaleString()}</>
}
