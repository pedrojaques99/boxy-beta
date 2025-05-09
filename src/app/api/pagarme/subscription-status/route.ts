import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

const PAGARME_API_KEY = process.env.PAGARME_API_KEY;
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

export async function POST(request: Request) {
  try {
    const { subscription_id } = await request.json();
    
    if (!subscription_id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get subscription from Pagar.me V5 API
    const response = await axios.get(
      `${PAGARME_API_URL}/subscriptions/${subscription_id}`,
      {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`
        }
      }
    );

    const pagarmeSubscription = response.data;

    if (!pagarmeSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found in Pagar.me' },
        { status: 404 }
      );
    }

    // Update subscription status in Supabase
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: pagarmeSubscription.status,
        updated_at: new Date().toISOString()
      })
      .eq('pagarme_subscription_id', subscription_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      status: pagarmeSubscription.status,
      message: 'Subscription status updated successfully'
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription status' },
      { status: 500 }
    );
  }
} 