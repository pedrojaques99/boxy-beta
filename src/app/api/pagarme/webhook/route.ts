import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { handleError } from '@/lib/error-handler'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE
const pagarmeApiKey = process.env.PAGARME_API_KEY

const WEBHOOK_EVENTS = {
  subscription_updated: 'subscription_updated',
  subscription_canceled: 'subscription_canceled',
  subscription_payment_failed: 'subscription_payment_failed',
  subscription_payment_succeeded: 'subscription_payment_succeeded'
} as const

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServiceClient()

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

    switch (type) {
      case WEBHOOK_EVENTS.subscription_updated:
      case WEBHOOK_EVENTS.subscription_payment_succeeded:
        await supabase
          .from('subscriptions')
          .update({
            status: data.subscription.status,
            current_period_end: data.subscription.current_period && data.subscription.current_period.end_at ? new Date(data.subscription.current_period.end_at * 1000).toISOString() : null,
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
        // Set user profile to free after cancellation
        {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('pagarme_subscription_id', data.subscription.id)
            .maybeSingle();
          if (sub && sub.user_id) {
            await supabase
              .from('profiles')
              .update({ subscription_type: 'free' })
              .eq('id', sub.user_id);
          }
        }
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
    const { error: errorMessage } = handleError(err, 'Error processing webhook');
    console.error('Webhook processing error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
