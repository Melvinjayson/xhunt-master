// Supabase Edge Function — Trial Reminder
// Finds users whose trial ends in ~3 days and sends them a reminder email.
// Deploy: supabase functions deploy trial-reminder
// Schedule via pg_cron (see 009_reminder.sql) or Supabase dashboard.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY     = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL         = Deno.env.get('FROM_EMAIL') ?? 'noreply@xhunt.app';
const APP_URL            = Deno.env.get('APP_URL') ?? 'https://xhunt.app';

interface UserProfile {
  id: string;
  trial_ends_at: string;
  trial_reminder_sent: boolean;
}

interface AuthUser {
  id: string;
  email?: string;
}

serve(async () => {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysFromNow   = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

  // Find trial users in the 2-3 day window who haven't been reminded yet
  const { data: profiles, error } = await sb
    .from('user_profiles')
    .select('id, trial_ends_at, trial_reminder_sent')
    .eq('subscription_tier', 'trial')
    .eq('trial_reminder_sent', false)
    .gte('trial_ends_at', twoDaysFromNow)
    .lte('trial_ends_at', threeDaysFromNow);

  if (error) {
    console.error('[trial-reminder] query error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No users to remind' }), { status: 200 });
  }

  let sent = 0;
  const skipped: string[] = [];

  for (const profile of profiles as UserProfile[]) {
    const daysLeft = Math.ceil(
      (new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Fetch user email from auth.users (requires service role)
    const { data: authData } = await sb.auth.admin.getUserById(profile.id);
    const email = (authData?.user as AuthUser | null)?.email;

    if (!email) {
      skipped.push(profile.id);
      continue;
    }

    // Send email via Resend (skip if key not configured)
    if (RESEND_API_KEY) {
      const html = buildEmailHtml({ email, daysLeft, appUrl: APP_URL });

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from:    FROM_EMAIL,
          to:      [email],
          subject: `⏰ Your X-hunt trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
          html,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error(`[trial-reminder] Resend error for ${profile.id}:`, errText);
        skipped.push(profile.id);
        continue;
      }
    } else {
      console.log(`[trial-reminder] RESEND_API_KEY not set — would email ${email} (${daysLeft} days left)`);
    }

    // Mark reminder as sent
    await sb
      .from('user_profiles')
      .update({ trial_reminder_sent: true })
      .eq('id', profile.id);

    sent++;
  }

  console.log(`[trial-reminder] sent=${sent}, skipped=${skipped.length}`);
  return new Response(JSON.stringify({ sent, skipped: skipped.length }), { status: 200 });
});

function buildEmailHtml({ email, daysLeft, appUrl }: { email: string; daysLeft: number; appUrl: string }): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your X-hunt trial is ending</title>
</head>
<body style="background:#070d0e;color:#e9eff0;font-family:system-ui,sans-serif;margin:0;padding:0;">
  <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:12px;">⏰</div>
      <h1 style="font-size:24px;font-weight:700;color:#e9eff0;margin:0 0 8px;">
        Your trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}
      </h1>
      <p style="font-size:15px;color:#7d8b8e;line-height:1.6;margin:0;">
        You've been exploring X-hunt on your 14-day trial. Don't lose access to
        AI assistance and premium missions.
      </p>
    </div>

    <div style="background:#0e1719;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="font-size:12px;font-weight:700;color:#54625f;letter-spacing:.06em;margin-bottom:16px;">WHAT YOU KEEP WITH PRO</div>
      ${['Unlimited AI mission assistance', 'Access to all premium & sponsored missions', 'Join exclusive Pro live sessions', 'Go Live and host your own experiences', 'Priority support'].map(f =>
        `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
           <span style="color:#27e07d;font-size:16px;">✓</span>
           <span style="font-size:14px;color:#e9eff0;">${f}</span>
         </div>`
      ).join('')}
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <a href="${appUrl}/upgrade" style="display:inline-block;padding:14px 32px;border-radius:14px;background:linear-gradient(135deg,#27e07d,#22d3ee);color:#070d0e;font-weight:700;font-size:16px;text-decoration:none;">
        Upgrade to Pro
      </a>
    </div>

    <p style="font-size:12px;color:#54625f;text-align:center;line-height:1.5;">
      If you don't upgrade, you'll revert to the free plan when your trial ends.<br>
      No charge until you upgrade.
    </p>

    <hr style="border:none;border-top:1px solid rgba(255,255,255,.07);margin:24px 0;">
    <p style="font-size:11px;color:#54625f;text-align:center;">
      This email was sent to ${email}.
      <a href="${appUrl}/profile" style="color:#27e07d;">Manage preferences</a>
    </p>
  </div>
</body>
</html>`;
}
