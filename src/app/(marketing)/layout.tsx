import type { Metadata } from 'next';
import Nav from '@/components/marketing/Nav';
import Footer from '@/components/marketing/Footer';

export const metadata: Metadata = {
  title: {
    default: 'X-hunt — Brands pay you to do real things. AI confirms it.',
    template: '%s · X-hunt',
  },
  description:
    'Complete real-world missions, upload proof, and get paid automatically. AI validates your evidence in under 60 seconds. No followers needed. Free to join.',
  keywords: [
    'earn money missions', 'get paid to exercise', 'brand challenges', 'AI verification',
    'escrow payments', 'hunter score', 'xhunt', 'paid missions', 'real-world tasks',
  ],
  openGraph: {
    type: 'website',
    siteName: 'X-hunt',
    title: 'X-hunt — Brands pay you to do real things. AI confirms it.',
    description: 'Complete missions, upload proof, get paid. AI validates in seconds. 5,800+ open missions right now.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'X-hunt' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'X-hunt — Brands pay you to do real things. AI confirms it.',
    description: 'Complete missions, upload proof, get paid. AI validates in seconds. 5,800+ open missions right now.',
    images: ['/og-image.png'],
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
