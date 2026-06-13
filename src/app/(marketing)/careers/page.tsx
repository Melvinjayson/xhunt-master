import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Careers' };

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[#050816] pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-3">Join the team</p>
          <h1 className="text-[36px] font-bold text-[#F0F4FF] mb-4">Careers at X-Hunt</h1>
          <p className="text-[#8B9CC0] text-base leading-relaxed">
            We&apos;re building the AI Mission Operating System. If you believe goals should turn into outcomes, not just intentions — come build with us.
          </p>
        </div>

        <div className="bg-[#07101F] border border-[rgba(255,255,255,0.06)] rounded-2xl p-8 text-center">
          <p className="text-[#F0F4FF] font-semibold text-lg mb-2">No open roles right now</p>
          <p className="text-[#8B9CC0] text-sm mb-6">
            We&apos;re growing carefully. Send us your story and what you&apos;d build — we read every message.
          </p>
          <Link
            href="mailto:careers@xhunt.app"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-[#050816] rounded-xl font-bold text-sm"
          >
            Get in Touch
          </Link>
        </div>

        <p className="text-[#4A5578] text-xs text-center mt-8">
          We&apos;re a remote-first team. We value builders, thinkers, and people who ship.
        </p>
      </div>
    </div>
  );
}
