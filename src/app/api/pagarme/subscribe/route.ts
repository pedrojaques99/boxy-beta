import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_id, email, name, plan_id, payment_method, card } = body

  try {
    const pagarme = await axios.post(
      'https://api.sandbox.pagar.me/core/v5/subscriptions',
      {
        plan_id,
        payment_method,
        customer: {
          email,
          name,
          type: 'individual',
          documents: [{ type: 'cpf', number: '12345678900' }] // ajustar depois
        },
        card: payment_method === 'credit_card' ? card : undefined,
        metadata: {
          supabase_user_id: user_id
        }
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.PAGARME_API_KEY! + ':').toString('base64')}`
        }
      }
    )

    const sub = pagarme.data

    await supabase.from('subscriptions').upsert({
      user_id,
      plan_id,
      pagarme_subscription_id: sub.id,
      status: sub.status,
      started_at: new Date().toISOString(),
      current_period_end: new Date(sub.current_period.end_at * 1000).toISOString()
    })

    return NextResponse.json({ success: true, subscription: sub })
  } catch (err: any) {
    console.error(err.response?.data || err.message)
    return NextResponse.json({ error: 'Erro ao criar assinatura' }, { status: 500 })
  }
}
