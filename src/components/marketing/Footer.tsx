'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';

const COLUMNS: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: 'Consumer Platform', href: '/consumer' },
    { label: 'Enterprise Platform', href: '/enterprise' },
    { label: 'Mission Control', href: '/mission-control' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Pricing', href: '/pricing' },
  ],
  'Use Cases': [
    { label: 'Workforce Training', href: '/use-cases#workforce' },
    { label: 'Customer Engagement', href: '/use-cases#customer' },
    { label: 'Learning & Development', href: '/use-cases#learning' },
    { label: 'Government Programs', href: '/use-cases#government' },
    { label: 'Higher Education', href: '/use-cases#education' },
  ],
  Developers: [
    { label: 'Documentation', href: '/developers' },
    { label: 'API Reference', href: '/developers/api' },
    { label: 'SDKs & Libraries', href: '/developers#sdks' },
    { label: 'Webhooks', href: '/developers#webhooks' },
    { label: 'Changelog', href: '/developers#changelog' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Security', href: '/security' },
  ],
};

const SOCIALS = [
  { label: 'X (Twitter)', href: 'https://x.com/xhuntapp', icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.733-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>) },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/xhunt', icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>) },
  { label: 'GitHub', href: 'https://github.com/xhuntapp', icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>) },
];

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#050816]">
      {/* Newsletter strip */}
      <div className="border-b border-[rgba(255,255,255,0.05)]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[15px] font-semibold text-txt">Stay ahead of the mission</p>
            <p className="text-sm text-txt-dim mt-0.5">Product updates, use cases, and outcome intelligence insights.</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="you@company.com"
              className="h-10 px-4 rounded-lg bg-[#07101F] border border-[rgba(255,255,255,0.08)] text-sm text-txt placeholder-txt-faint focus:outline-none focus:border-accent/40 transition-colors w-full sm:w-56"
            />
            <button type="submit" className="h-10 px-4 bg-accent text-[#050816] rounded-lg text-sm font-bold whitespace-nowrap hover:bg-accent-dark transition-colors flex-shrink-0">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-8 lg:gap-6 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="mb-4">
              <Logo size="sm" href="/" />
            </div>
            <p className="text-sm text-txt-dim leading-relaxed max-w-[210px]">
              The AI Mission Operating System. Turn goals into outcomes at scale.
            </p>
            <div className="flex items-center gap-2 mt-6">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-[#07101F] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-txt-dim hover:text-txt hover:border-[rgba(255,255,255,0.12)] transition-colors">
                  {s.icon}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-xs text-txt-dim">All systems operational</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(COLUMNS).map(([cat, links]) => (
            <div key={cat} className="lg:col-span-1">
              <p className="text-[10px] font-bold text-txt-faint uppercase tracking-widest mb-4">{cat}</p>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[13px] text-txt-dim hover:text-txt transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-txt-faint">© 2026 X-hunt, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[12px] text-txt-faint hover:text-txt-dim transition-colors">Privacy</Link>
            <Link href="/terms" className="text-[12px] text-txt-faint hover:text-txt-dim transition-colors">Terms</Link>
            <Link href="/cookies" className="text-[12px] text-txt-faint hover:text-txt-dim transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
