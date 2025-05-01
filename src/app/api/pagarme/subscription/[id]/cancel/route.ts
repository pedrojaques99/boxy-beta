import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import { handleError } from '@/lib/error-handler'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE
const pagarmeApiKey = process.env.PAGARME_API_KEY

const supabase = supabaseUrl && supabaseServiceRole 
  ? createClient(supabaseUrl, supabaseServiceRole)
  : null

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseUrl || !supabaseServiceRole || !pagarmeApiKey) {
    console.error('Missing environment variables')
    return NextResponse.json({ error: 'Service configuration error' }, { status: 500 })
  }

  try {
    // Cancel subscription in Pagar.me
    const response = await axios.put(
      `https://api.sandbox.pagar.me/core/v5/subscriptions/${params.id}/cancel`,
      {},
      {
        headers: {
          Authorization: `Basic ${Buffer.from(pagarmeApiKey + ':').toString('base64')}`
        }
      }
    )

    const subscription = response.data

    // Update subscription in Supabase
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 })
    }

    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', params.id)

    return NextResponse.json({ success: true, subscription })
  } catch (err) {
    const { error: errorMessage } = handleError(err, 'Error canceling subscription');
    console.error('Subscription cancellation error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 