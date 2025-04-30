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

const WEBHOOK_EVENTS = {
  subscription_updated: 'subscription_updated',
  subscription_canceled: 'subscription_canceled',
  subscription_payment_failed: 'subscription_payment_failed',
  subscription_payment_succeeded: 'subscription_payment_succeeded'
} as const

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
    console.error('Invalid webhook signature')
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const { type, data } = event

  try {
    switch (type) {
      case WEBHOOK_EVENTS.subscription_updated:
      case WEBHOOK_EVENTS.subscription_payment_succeeded:
        await supabase
          .from('subscriptions')
          .update({
            status: data.subscription.status,
            current_period_end: new Date(data.subscription.current_period.end_at * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('pagarme_subscription_id', data.subscription.id)
        break

      case WEBHOOK_EVENTS.subscription_canceled:
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('pagarme_subscription_id', data.subscription.id)
        break

      case WEBHOOK_EVENTS.subscription_payment_failed:
        await supabase
          .from('subscriptions')
          .update({
            status: 'payment_failed',
            last_payment_error: data.payment.error_message,
            updated_at: new Date().toISOString()
          })
          .eq('pagarme_subscription_id', data.subscription.id)
        break

      default:
        console.log('Unhandled webhook event:', type)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 })
  }
}
