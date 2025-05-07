import { Suspense } from 'react'
import MindyClient from './client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default function MindyPage() {
  return (
    <Suspense fallback={<p>Loading mindy...</p>}>
      <MindyClient />
    </Suspense>
  )
}
