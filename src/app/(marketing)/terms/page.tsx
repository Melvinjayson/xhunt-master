import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service' };

const LAST_UPDATED = 'June 10, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050816] pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-[36px] font-bold text-[#F0F4FF] mb-3">Terms of Service</h1>
          <p className="text-[#8B9CC0] text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-invert max-w-none text-[#8B9CC0] text-[15px] leading-relaxed space-y-8">
          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using X-Hunt, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">2. Use of Services</h2>
            <p>X-Hunt grants you a limited, non-exclusive, non-transferable licence to use our platform for your personal or organizational purposes. You may not resell, sublicense, or exploit the platform commercially without our written consent.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">3. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at security@xhunt.app if you suspect unauthorized access.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">4. Subscriptions and Billing</h2>
            <p>Paid subscriptions are billed in advance on a monthly or annual cycle. You may cancel at any time; cancellation takes effect at the end of the current billing period. Refunds are handled in accordance with our refund policy.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">5. Intellectual Property</h2>
            <p>X-Hunt and its content are owned by X-Hunt, Inc. Mission content you create remains your property; by creating it on the platform you grant us a licence to display and deliver it to mission participants.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">6. Prohibited Conduct</h2>
            <p>You may not use X-Hunt to distribute harmful, illegal, or deceptive content, attempt to reverse-engineer the platform, or circumvent any access controls or rate limits.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, X-Hunt&apos;s liability for any claim arising from your use of the platform is limited to the amount you paid in the 12 months prior to the claim.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">8. Contact</h2>
            <p>Legal questions: <a href="mailto:legal@xhunt.app" className="text-accent hover:underline">legal@xhunt.app</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
