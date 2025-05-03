import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { PLANS, PlanId } from '@/lib/plans'
import { handleError } from '@/lib/error-handler'

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE
const pagarmeApiKey = process.env.PAGARME_API_KEY

// Only create Supabase client if all required variables are present
const supabase = supabaseUrl && supabaseServiceRole 
  ? createClient(supabaseUrl, supabaseServiceRole)
  : null

export async function POST(req: NextRequest) {
  // Validate environment variables with detailed logging
  const missingVars = []
  if (!supabaseUrl) missingVars.push('SUPABASE_URL')
  if (!supabaseServiceRole) missingVars.push('SUPABASE_SERVICE_ROLE')
  if (!pagarmeApiKey) missingVars.push('PAGARME_API_KEY')

  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars)
    return NextResponse.json({ 
      error: 'Service configuration error',
      details: `Missing required environment variables: ${missingVars.join(', ')}`
    }, { status: 500 })
  }

  const body = await req.json()
  const { user_id, email, name, plan_id, payment_method, card } = body

  // Log the request data (without sensitive information)
  console.log('Subscription request:', {
    user_id,
    email,
    name,
    plan_id,
    payment_method,
    card: card ? {
      ...card,
      number: card.number.replace(/\d(?=\d{4})/g, '*'),
      cvv: '***'
    } : null
  })

  // Validate required fields
  if (!user_id || !email || !name || !plan_id || !payment_method) {
    const missingFields = []
    if (!user_id) missingFields.push('user_id')
    if (!email) missingFields.push('email')
    if (!name) missingFields.push('name')
    if (!plan_id) missingFields.push('plan_id')
    if (!payment_method) missingFields.push('payment_method')

    console.error('Missing required fields:', missingFields)
    return NextResponse.json({ 
      error: 'Missing required fields',
      details: `The following fields are required: ${missingFields.join(', ')}`
    }, { status: 400 })
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

    // Save subscription in Supabase
    await supabase
      .from('subscriptions')
      .insert({
        user_id,
        plan_id: plan.id,
        status: subscription.status,
        pagarme_subscription_id: subscription.id,
        pagarme_customer_id: customer.id,
        current_period_end: new Date(subscription.current_period.end_at * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    return NextResponse.json({ success: true, subscription })
  } catch (err) {
    const { error: errorMessage } = handleError(err, 'Error creating subscription');
    console.error('Subscription creation error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
