import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { createServiceClient } from '@/lib/supabase/server'
import { handleError } from '@/lib/error-handler'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE
const pagarmeApiKey = process.env.PAGARME_API_KEY

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServiceClient()

    // Check if all required environment variables are present
    if (!supabaseUrl || !supabaseServiceRole || !pagarmeApiKey) {
      return NextResponse.json(
        { error: 'Missing required environment variables' },
        { status: 500 }
      )
    }

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