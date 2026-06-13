import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Cookie Policy' };

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#050816] pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-[36px] font-bold text-[#F0F4FF] mb-3">Cookie Policy</h1>
          <p className="text-[#8B9CC0] text-sm">Last updated: June 10, 2026</p>
        </div>

        <div className="prose prose-invert max-w-none text-[#8B9CC0] text-[15px] leading-relaxed space-y-8">
          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit X-Hunt. They help us keep you signed in, remember preferences, and understand how the platform is used.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">Cookies We Use</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-[#F0F4FF]">Essential</strong> — Required for authentication and security. Cannot be disabled.</li>
              <li><strong className="text-[#F0F4FF]">Analytics</strong> — Help us understand usage patterns to improve the product. You can opt out.</li>
              <li><strong className="text-[#F0F4FF]">Preferences</strong> — Store your settings such as theme and notification preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">Managing Cookies</h2>
            <p>You can manage or delete cookies through your browser settings. Disabling essential cookies will prevent you from using authenticated features of the platform.</p>
          </section>

          <section>
            <h2 className="text-[20px] font-semibold text-[#F0F4FF] mb-3">Contact</h2>
            <p>Questions? Email <a href="mailto:privacy@xhunt.app" className="text-accent hover:underline">privacy@xhunt.app</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
