import { Metadata } from 'next'
import HelpContent from './HelpContent'

export const metadata: Metadata = {
  title: 'Help - Clay Target Tournaments',
  description: 'Complete guide to using the Clay Target Tournaments application',
}

export default function HelpPage() {
  return <HelpContent />
}

