import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Blog' };

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#050816] pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">✍️</span>
        </div>
        <h1 className="text-[36px] font-bold text-[#F0F4FF] mb-4">Blog</h1>
        <p className="text-[#8B9CC0] text-base leading-relaxed mb-8">
          Insights on AI missions, outcome intelligence, and the future of goal achievement. Coming soon.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-[#050816] rounded-xl font-bold text-sm"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
