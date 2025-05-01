import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { PLANS, PlanId } from '@/lib/plans'

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE
const pagarmeApiKey = process.env.PAGARME_API_KEY

// Only create Supabase client if all required variables are present
const supabase = supabaseUrl && supabaseServiceRole 
  ? createClient(supabaseUrl, supabaseServiceRole)
  : null

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseServiceRole || !pagarmeApiKey) {
    console.error('Missing environment variables')
    return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
  }

  const body = await req.json()
  const { user_id, email, name, plan_id, payment_method, card } = body

  // Validate required fields
  if (!user_id || !email || !name || !plan_id || !payment_method) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }

  // Get user's CPF
  if (!supabase) {
    return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id)
  if (userError) {
    console.error('Error getting user:', userError)
    return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 })
  }

  const cpf = userData.user.user_metadata?.cpf
  if (!cpf) {
    return NextResponse.json({ 
      error: 'CPF não encontrado',
      details: 'Por favor, adicione seu CPF no perfil antes de assinar'
    }, { status: 400 })
  }

  // Validate plan
  if (!(plan_id in PLANS)) {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }
  const plan = PLANS[plan_id as PlanId]

  // Validate card data if credit card payment
  if (payment_method === 'credit_card') {
    if (!card?.holder_name || !card?.number || !card?.exp_month || !card?.exp_year || !card?.cvv) {
      return NextResponse.json({ error: 'Dados do cartão incompletos' }, { status: 400 })
    }
  }

  try {
    // First create the customer
    const customerResponse = await axios.post(
      'https://api.sandbox.pagar.me/core/v5/customers',
      {
        name,
        email,
        type: 'individual',
        code: user_id,
        document_type: 'cpf',
        document: cpf
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(pagarmeApiKey + ':').toString('base64')}`
        }
      }
    )

    const customer = customerResponse.data

    // Then create the subscription
    const subscriptionResponse = await axios.post(
      'https://api.sandbox.pagar.me/core/v5/subscriptions',
      {
        plan_id: plan.pagarme_plan_id,
        payment_method,
        customer_id: customer.id,
        card: payment_method === 'credit_card' ? {
          ...card,
          holder_document: cpf
        } : undefined,
        metadata: {
          supabase_user_id: user_id,
          plan_id: plan.id
        }
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(pagarmeApiKey + ':').toString('base64')}`
        }
      }
    )

    const subscription = subscriptionResponse.data

    // Store in Supabase
    await supabase.from('subscriptions').upsert({
      user_id,
      plan_id: plan.id,
      pagarme_subscription_id: subscription.id,
      pagarme_customer_id: customer.id,
      status: subscription.status,
      started_at: new Date().toISOString(),
      current_period_end: new Date(subscription.current_period.end_at * 1000).toISOString()
    })

    return NextResponse.json({ 
      success: true, 
      subscription,
      customer
    })
  } catch (err) {
    console.error('Subscription error:', err instanceof Error ? err.message : 'Unknown error')
    const error = err instanceof Error ? err.message : 'Erro ao criar assinatura'
    return NextResponse.json({ error }, { status: 500 })
  }
}
