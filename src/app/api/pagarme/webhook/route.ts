import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature') || ''

  const hmac = crypto.createHmac('sha256', process.env.PAGARME_API_KEY!)
  hmac.update(rawBody)
  const digest = `sha256=${hmac.digest('hex')}`

  if (signature !== digest) {
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const { type, data } = event

  if (type === 'subscription_updated') {
    const sub = data.subscription

    await supabase
      .from('subscriptions')
      .update({
        status: sub.status,
        current_period_end: new Date(sub.current_period.end_at * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
