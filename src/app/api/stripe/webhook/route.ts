import Stripe from 'stripe';
import { env } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Stripe sends raw bytes — we must NOT parse the body via Next.js
export async function POST(request: Request) {
  if (!env.stripeSecretKey || !env.stripeWebhookSecret ||
      env.stripeSecretKey.includes('REPLACE_ME') || env.stripeWebhookSecret.includes('REPLACE_ME')) {
    return Response.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const sig  = request.headers.get('stripe-signature');
  const body = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = new Stripe(env.stripeSecretKey);
    event = stripe.webhooks.constructEvent(body, sig!, env.stripeWebhookSecret);
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Use the admin (service-role) client so RLS doesn't block the updates
  let sb: ReturnType<typeof createAdminClient>;
  try {
    sb = createAdminClient();
  } catch {
    console.error('[stripe/webhook] admin client unavailable — SUPABASE_SERVICE_ROLE_KEY missing');
    // Still return 200 so Stripe doesn't retry indefinitely
    return Response.json({ received: true, warning: 'DB update skipped' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session   = event.data.object as Stripe.Checkout.Session;
        const userId    = session.metadata?.supabase_user_id;
        const custId    = session.customer as string | null;

        if (userId && custId) {
          await sb.from('user_profiles').update({
            stripe_customer_id: custId,
            subscription_tier:  'pro',
          }).eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub    = event.data.object as Stripe.Subscription;
        const custId = sub.customer as string;
        const active = sub.status === 'active' || sub.status === 'trialing';

        await sb.from('user_profiles').update({
          subscription_tier:     active ? 'pro' : 'free',
          stripe_subscription_id: sub.id,
        }).eq('stripe_customer_id', custId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await sb.from('user_profiles').update({
          subscription_tier: 'free',
        }).eq('stripe_customer_id', sub.customer as string);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn('[stripe/webhook] payment failed for customer', invoice.customer);
        break;
      }

      default:
        // Unhandled event — log and acknowledge
        break;
    }
  } catch (err) {
    console.error('[stripe/webhook] DB update error:', err);
  }

  return Response.json({ received: true });
}
