import { Metadata } from 'next'
import HelpContent from './HelpContent'

export const metadata: Metadata = {
  title: 'Help - Clay Target Tracker',
  description: 'Complete guide to using the Clay Target Tracker application',
}

export default function HelpPage() {
  return <HelpContent />
}

