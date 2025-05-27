import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { handleError } from '@/lib/error-handler'
import { Resend } from 'resend'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE
const pagarmeApiKey = process.env.PAGARME_API_KEY

const WEBHOOK_EVENTS = {
  subscription_updated: 'subscription.updated',
  subscription_canceled: 'subscription.canceled',
  subscription_payment_failed: 'invoice.payment_failed',
  subscription_payment_succeeded: 'invoice.paid'
} as const

const resend = new Resend(process.env.RESEND_API_KEY)

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

    // Log para debug do algoritmo de assinatura
    console.log('Signature header recebido:', signature)

    // Testa ambos algoritmos para facilitar debug
    const hmacSha1 = crypto.createHmac('sha1', pagarmeApiKey)
    hmacSha1.update(rawBody)
    const digestSha1 = `sha1=${hmacSha1.digest('hex')}`
    console.log('Digest calculado (sha1):', digestSha1)

    const hmacSha256 = crypto.createHmac('sha256', pagarmeApiKey)
    hmacSha256.update(rawBody)
    const digestSha256 = `sha256=${hmacSha256.digest('hex')}`
    console.log('Digest calculado (sha256):', digestSha256)

    // Use o algoritmo que bater com o header
    let digest = ''
    if (signature.startsWith('sha1=')) {
      digest = digestSha1
    } else if (signature.startsWith('sha256=')) {
      digest = digestSha256
    } else {
      digest = digestSha1 // fallback para sha1
    }

    if (signature !== digest) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const { type, data } = event

    // Extrair início/fim do ciclo atual se existir
    const currentCycle = data.current_cycle || {}
    const periodStart = currentCycle.start_at ? new Date(currentCycle.start_at).toISOString() : null
    const periodEnd = currentCycle.end_at ? new Date(currentCycle.end_at).toISOString() : null

    switch (type) {
      case WEBHOOK_EVENTS.subscription_updated:
        await supabase
          .from('subscriptions')
          .update({
            status: data.status || 'active',
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString()
          })
          .eq('pagarme_subscription_id', data.id)
        break

      case WEBHOOK_EVENTS.subscription_payment_succeeded:
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
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
          .eq('pagarme_subscription_id', data.id)

        // Set user profile to free after cancellation
        {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('pagarme_subscription_id', data.id)
            .maybeSingle()
          if (sub && sub.user_id) {
            await supabase
              .from('profiles')
              .update({ subscription_type: 'free' })
              .eq('id', sub.user_id)
          }
        }
        break

      case WEBHOOK_EVENTS.subscription_payment_failed:
        await supabase
          .from('subscriptions')
          .update({
            status: 'payment_failed',
            last_payment_error: data.payment?.error_message || 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('pagarme_subscription_id', data.subscription.id)
        break

      default:
        console.log('Unhandled webhook event:', type)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const { error: errorMessage } = handleError(err, 'Error processing webhook')
    console.error('Webhook processing error:', errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
