import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { createServiceClient } from '@/lib/supabase/server'
import { PLANS, PlanId } from '@/lib/plans'
import { handleError } from '@/lib/error-handler'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE
const pagarmeApiKey = process.env.PAGARME_API_KEY

export async function POST(request: Request) {
  try {
    // 1. Validar o token de sessão do header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '').trim()

    // 2. Validar o token com o Supabase
    const supabase = await createServiceClient()
    const { data: { user }, error: userTokenError } = await supabase.auth.getUser(token)
    if (userTokenError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 })
    }

    // 3. Validar se o user_id do body bate com o do token
    const body = await request.json()
    if (body.user_id !== user.id) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 })
    }

    // Check if all required environment variables are present
    if (!supabaseUrl || !supabaseServiceRole || !pagarmeApiKey) {
      return NextResponse.json(
        { error: 'Missing required environment variables' },
        { status: 500 }
      )
    }

    const { user_id, email, name, plan_id, payment_method, card, billing_address } = body

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
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id)
    if (userError) {
      console.error('Error getting user:', userError)
      return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 })
    }

    // Preferir o CPF enviado pelo frontend, senão pegar do user_metadata
    const cpf = card?.cpf || (userData && userData.user && userData.user.user_metadata?.cpf)
    if (!cpf) {
      return NextResponse.json({ 
        error: 'CPF não encontrado',
        details: 'Por favor, preencha o CPF no checkout ou no perfil antes de assinar'
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

    // Prevent duplicate active subscriptions
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .maybeSingle();
    if (existingSubscription) {
      return NextResponse.json({ error: 'User already has an active subscription' }, { status: 400 });
    }

    // 1. Criar ou buscar customer
    const customerPayload = {
      name,
      email,
      type: 'individual',
      code: user_id,
      document_type: 'cpf',
      document: cpf,
      address: billing_address
    };
    const customerResponse = await axios.post(
      'https://api.pagar.me/core/v5/customers',
      customerPayload,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(pagarmeApiKey + ':').toString('base64')}`
        }
      }
    );
    const customer = customerResponse.data;

    // 2. Criar assinatura conforme doc oficial
    const subscriptionPayload: any = {
      plan_id: plan.pagarme_plan_id,
      payment_method,
      installments: 1,
      customer: {
        name,
        email,
        type: 'individual',
        document: cpf,
        document_type: 'cpf',
        phones: body.customer?.phones || {
          mobile_phone: {
            country_code: '55',
            area_code: body.phone?.substring(0, 2) || '11',
            number: body.phone?.substring(2) || '999999999'
          }
        }
      },
      card: payment_method === 'credit_card' ? {
        holder_name: card.holder_name,
        number: card.number,
        exp_month: card.exp_month,
        exp_year: card.exp_year,
        cvv: card.cvv,
        billing_address: {
          line_1: `${billing_address.street}, ${billing_address.number}`,
          line_2: billing_address.complement,
          zip_code: billing_address.zip_code,
          city: billing_address.city,
          state: billing_address.state,
          country: billing_address.country
        }
      } : undefined,
      billing: {
        address: {
          line_1: `${billing_address.street}, ${billing_address.number}`,
          line_2: billing_address.complement,
          zip_code: billing_address.zip_code,
          city: billing_address.city,
          state: billing_address.state,
          country: billing_address.country
        }
      },
      discounts: body.discounts || [
        { cycles: 3, value: 10, discount_type: 'percentage' }
      ],
      increments: body.increments || [
        { cycles: 2, value: 20, increment_type: 'percentage' }
      ],
      metadata: {
        supabase_user_id: user_id,
        plan_id: plan.id
      }
      // boleto_due_days podem ser adicionados aqui se necessário
    };

    const subscriptionResponse = await axios.post(
      'https://api.pagar.me/core/v5/subscriptions',
      subscriptionPayload,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(pagarmeApiKey + ':').toString('base64')}`
        }
      }
    );
    const subscription = subscriptionResponse.data;

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

    // Update user profile to premium and store CPF if not present
    await supabase
      .from('profiles')
      .update({ subscription_type: 'premium', cpf: cpf })
      .eq('id', user_id);

    // Retornar todos os campos relevantes da assinatura criada
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_id: subscription.plan_id,
        payment_method: subscription.payment_method,
        current_period: subscription.current_period,
        customer: subscription.customer,
        billing: subscription.billing,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at,
        charges: subscription.charges,
        items: subscription.items,
        metadata: subscription.metadata
      }
    })
  } catch (err) {
    // Log completo do erro
    console.error('Subscription creation error:', err);
    let errorMessage = 'Erro desconhecido no backend';
    let errorStack = undefined;
    let pagarmeDetails = undefined;
    let pagarmeRequest = undefined;

    // Se for erro do axios (Pagar.me)
    const axiosErr = err as any;
    if (axiosErr && typeof axiosErr === 'object' && 'response' in axiosErr && axiosErr.response && axiosErr.response.data) {
      errorMessage = axiosErr.response.data.message || 'Erro do Pagar.me';
      pagarmeDetails = axiosErr.response.data.errors || axiosErr.response.data;
      pagarmeRequest = axiosErr.response.data.request || undefined;
    } else if (err instanceof Error) {
      errorMessage = err.message;
      errorStack = err.stack;
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err && typeof err === 'object' && 'message' in err) {
      errorMessage = (err as any).message;
    }

    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json({
      error: errorMessage,
      details: pagarmeDetails,
      request: pagarmeRequest,
      ...(isDev && errorStack ? { stack: errorStack } : {})
    }, { status: 500 });
  }
}

// TODO: Handle subscription cancellation/expiration webhook to revert subscription_type to 'free' in the user's profile.
// This should be implemented in the webhook handler for Pagar.me events.
