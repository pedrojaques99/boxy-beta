import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE
const pagarmeApiKey = process.env.PAGARME_API_KEY

// Only create Supabase client if all required variables are present
const supabase = supabaseUrl && supabaseServiceRole 
  ? createClient(supabaseUrl, supabaseServiceRole)
  : null

export async function POST(req: NextRequest) {
  // Check if all required environment variables are present
  if (!supabaseUrl || !supabaseServiceRole || !pagarmeApiKey) {
    console.error('Missing environment variables:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceRole: !!supabaseServiceRole,
      hasPagarmeApiKey: !!pagarmeApiKey
    })
    return NextResponse.json(
      { error: 'Service configuration error' },
      { status: 500 }
    )
  }

  if (!supabase) {
    return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature') || ''

  const hmac = crypto.createHmac('sha256', pagarmeApiKey)
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
