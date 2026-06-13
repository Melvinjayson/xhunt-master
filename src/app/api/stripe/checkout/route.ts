import Stripe from 'stripe';
import { env } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!env.stripeSecretKey || env.stripeSecretKey.includes('REPLACE_ME')) {
    return Response.json({ error: 'Payment system not yet configured' }, { status: 503 });
  }

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { priceId } = await request.json().catch(() => ({} as { priceId?: string }));
  const price = priceId ?? env.stripeProPriceId;
  if (!price || price.includes('REPLACE_ME')) {
    return Response.json({ error: 'No price configured' }, { status: 503 });
  }

  const stripe = new Stripe(env.stripeSecretKey);

  // Get or create Stripe customer tied to this Supabase user
  const { data: profile } = await sb
    .from('user_profiles')
    .select('stripe_customer_id, display_name')
    .eq('id', user.id)
    .single();

  let customerId = profile?.stripe_customer_id as string | undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    user.email,
      name:     profile?.display_name ?? undefined,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await sb
      .from('user_profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const origin = new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    customer:              customerId,
    mode:                  'subscription',
    line_items:            [{ price, quantity: 1 }],
    success_url:           `${origin}/upgrade?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:            `${origin}/upgrade?canceled=true`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
    billing_address_collection: 'auto',
    customer_update: { address: 'auto' },
  });

  return Response.json({ url: session.url });
}
