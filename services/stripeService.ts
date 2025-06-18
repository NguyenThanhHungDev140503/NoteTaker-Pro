import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface CreateCheckoutSessionParams {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_id: params.priceId,
        mode: params.mode,
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
}

export async function getUserSubscription() {
  try {
    const { data, error } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export async function getUserOrders() {
  try {
    const { data, error } = await supabase
      .from('stripe_user_orders')
      .select('*')
      .order('order_date', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}