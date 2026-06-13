import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  // Verify the webhook signature using svix (Clerk's delivery provider)
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const headersList = await headers();
  const svixId        = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Dynamically import svix to verify signature
  const { Webhook } = await import('svix');
  const body = await req.text();

  let evt: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(body, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof evt;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data as {
      id: string;
      email_addresses: Array<{ email_address: string; id: string }>;
      first_name: string | null;
      last_name: string | null;
      image_url: string | null;
    };

    const email     = email_addresses?.[0]?.email_address ?? '';
    const fullName  = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0];
    const avatarUrl = image_url ?? null;

    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from('profiles').upsert({
        clerk_user_id: id,
        name:          fullName,
        email,
        avatar_url:    avatarUrl,
        tier:          'free',
        xp:            0,
      }, { onConflict: 'clerk_user_id' });

      if (error) {
        console.error('[clerk/webhook] profile upsert error:', error);
        return NextResponse.json({ error: 'DB error' }, { status: 500 });
      }
    } catch (err) {
      console.error('[clerk/webhook] unexpected error:', err);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
