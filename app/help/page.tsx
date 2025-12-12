import { Metadata } from 'next'
import HelpContent from './HelpContent'

export const metadata: Metadata = {
  title: 'Help - COYESS Tournaments',
  description: 'Complete guide to using the COYESS Tournaments application',
}

export default function HelpPage() {
  return <HelpContent />
}

