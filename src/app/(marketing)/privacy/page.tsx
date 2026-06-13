import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

const LAST_UPDATED = 'June 10, 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050816] pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-[36px] font-bold text-[#F0F4FF] mb-3">Privacy Policy</h1>
          <p className="text-[#8B9CC0] text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-invert max-w-none text-[#8B9CC0] text-[15px] leading-relaxed space-y-8">
          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">1. Information We Collect</h2>
            <p>We collect information you provide when you create an account, use our services, or contact us. This includes your name, email address, and usage data about how you interact with X-Hunt missions and features.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">2. How We Use Your Information</h2>
            <p>We use your information to provide, improve, and personalise the X-Hunt platform. This includes delivering AI-powered mission recommendations, processing payments, and sending product updates you&apos;ve opted into.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal data. We share information only with service providers necessary to operate our platform (such as payment processors and cloud infrastructure), and only under strict confidentiality agreements.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">4. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us at privacy@xhunt.app.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">5. Security</h2>
            <p>We implement industry-standard security measures including encryption at rest and in transit, access controls, and regular security audits to protect your data.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">6. Your Rights</h2>
            <p>Depending on your location, you may have rights to access, correct, delete, or export your personal data. To exercise these rights, contact us at privacy@xhunt.app.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">7. Contact</h2>
            <p>Questions about this policy? Email <a href="mailto:privacy@xhunt.app" className="text-accent hover:underline">privacy@xhunt.app</a> or write to X-Hunt, Inc., privacy team.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
