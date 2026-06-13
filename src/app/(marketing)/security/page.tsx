import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Security' };

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#050816] pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-3">Trust & Safety</p>
          <h1 className="text-[36px] font-bold text-[#F0F4FF] mb-3">Security</h1>
          <p className="text-[#8B9CC0] text-base leading-relaxed">
            X-Hunt is built with security as a core principle. Here&apos;s how we protect your data and our platform.
          </p>
        </div>

        <div className="space-y-6">
          {[
            { title: 'Encryption', body: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). API keys and secrets are stored using environment-level secrets management, never in source code.' },
            { title: 'Authentication', body: 'Authentication is handled by Supabase Auth with support for passwordless email, OAuth providers (Google), and multi-factor authentication. Session tokens are rotated on each login.' },
            { title: 'Infrastructure', body: 'X-Hunt runs on Vercel and Supabase with automatic DDoS protection, rate limiting on all API routes, and zero-trust network policies.' },
            { title: 'Access Controls', body: 'Role-based access control (RBAC) is enforced at both the application and database layer. Admin routes require verified tenant accounts.' },
            { title: 'Responsible Disclosure', body: 'Found a vulnerability? Please report it to security@xhunt.app. We aim to acknowledge reports within 48 hours and resolve critical issues within 7 days.' },
          ].map(({ title, body }) => (
            <div key={title} className="bg-[#07101F] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <h2 className="text-[17px] font-semibold text-[#F0F4FF] mb-2">{title}</h2>
              <p className="text-[14px] text-[#8B9CC0] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
