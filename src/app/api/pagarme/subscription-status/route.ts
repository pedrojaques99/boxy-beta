import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPagarmeClient } from '@/lib/pagarme';

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
    const pagarme = getPagarmeClient();

    // Get subscription from Pagar.me
    const pagarmeSubscription = await pagarme.subscriptions.find(subscription_id);

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