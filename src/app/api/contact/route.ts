import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

interface ContactPayload {
  inquiryType: string;
  name:        string;
  email:       string;
  org?:        string;
  message:     string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: Partial<ContactPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { inquiryType, name, email, org, message } = body;

  if (!inquiryType || !name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 422 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 422 });
  }

  // Store in Supabase (table created by migration below — falls back gracefully if absent)
  try {
    const cookieStore = await cookies();
    const sb = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    );

    await sb.from('contact_submissions').insert({
      inquiry_type: inquiryType,
      name:         name.trim().slice(0, 120),
      email:        email.toLowerCase().trim(),
      org:          org?.trim().slice(0, 120) ?? null,
      message:      message.trim().slice(0, 4000),
    });
  } catch (err) {
    // Non-fatal: table may not exist yet. Log and continue.
    console.warn('[contact/route] DB insert skipped:', err);
  }

  return NextResponse.json({ ok: true });
}
