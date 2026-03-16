'use client'

import { useState, useEffect } from 'react'

export function LocalTime({ isoString }: { isoString: string }) {
  const [display, setDisplay] = useState<string | null>(null)

  useEffect(() => {
    setDisplay(new Date(isoString).toLocaleString())
  }, [isoString])

  if (display === null) return null

  return <>{display}</>
}
