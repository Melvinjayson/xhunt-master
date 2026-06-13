'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, Building2, Code2, Users, MessageSquare, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

const INQUIRY_TYPES = [
  { id: 'sales', label: 'Enterprise Sales', icon: Building2, desc: 'Deployment planning, pricing, and demo requests' },
  { id: 'general', label: 'General Inquiry', icon: MessageSquare, desc: 'Questions about the platform and capabilities' },
  { id: 'developer', label: 'Developer / API', icon: Code2, desc: 'Integration support, API access, partnerships' },
  { id: 'partnership', label: 'Partnerships', icon: Users, desc: 'Channel partners, integrations, and co-marketing' },
];

export default function ContactPage() {
  const [inquiryType, setInquiryType] = useState('');
  const [form, setForm] = useState({ name: '', email: '', org: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inquiryType || !form.name || !form.email || !form.message) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryType, ...form }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch {
      alert('Something went wrong — please email us directly at hello@xhunt.app');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center px-5 pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md text-center"
        >
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={28} className="text-accent" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black text-txt mb-3">Message received.</h2>
          <p className="text-txt-dim text-[14px] leading-relaxed">
            Our team will get back to you within 1 business day. For enterprise inquiries, expect a response within a few hours.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-muted text-txt overflow-x-hidden">
      <section className="relative pt-28 pb-20 lg:pt-36 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-0 w-[600px] h-[400px] bg-ai/3 blur-[100px] rounded-full" />
        </div>
        <div className="relative max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left info */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[12px] font-bold text-accent uppercase tracking-widest mb-4"
              >
                Contact
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-black text-txt leading-[1.05] tracking-tighter mb-5"
              >
                Let&apos;s talk
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-dark">
                  outcomes.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="text-[1rem] text-txt-dim leading-relaxed mb-10 max-w-[440px]"
              >
                Whether you&apos;re planning an enterprise deployment, exploring the API, or just want to understand what X-hunt can do for your specific situation — our team is here.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-4"
              >
                {[
                  { icon: Building2, title: 'Enterprise Sales', email: 'sales@xhunt.app', desc: 'Deployment planning, custom pricing' },
                  { icon: Code2, title: 'Developer Support', email: 'developers@xhunt.app', desc: 'API, integrations, SDKs' },
                  { icon: Mail, title: 'General Inquiries', email: 'hello@xhunt.app', desc: 'Everything else' },
                ].map((c) => (
                  <div key={c.title} className="flex items-start gap-4 bg-card border border-[rgba(255,255,255,0.07)] rounded-xl p-4">
                    <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <c.icon size={17} strokeWidth={1.8} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-txt">{c.title}</p>
                      <p className="text-[12px] text-txt-faint">{c.desc}</p>
                      <a href={`mailto:${c.email}`} className="text-[12px] text-accent hover:text-accent-dark transition-colors mt-0.5 block">
                        {c.email}
                      </a>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card border border-[rgba(255,255,255,0.07)] rounded-2xl p-7 shadow-[0_16px_64px_rgba(0,0,0,0.4)]"
            >
              <p className="text-[15px] font-bold text-txt mb-1">Send us a message</p>
              <p className="text-[12px] text-txt-dim mb-6">We respond within 1 business day.</p>

              {/* Inquiry type */}
              <div className="mb-5">
                <p className="text-[11px] font-bold text-txt-faint uppercase tracking-wider mb-2">Inquiry type</p>
                <div className="grid grid-cols-2 gap-2">
                  {INQUIRY_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setInquiryType(type.id)}
                      className={cn(
                        'flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all',
                        inquiryType === type.id
                          ? 'border-accent bg-accent/6'
                          : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]',
                      )}
                    >
                      <type.icon
                        size={15}
                        strokeWidth={2}
                        className={inquiryType === type.id ? 'text-accent' : 'text-txt-dim'}
                      />
                      <span className={cn('text-[12px] font-semibold', inquiryType === type.id ? 'text-accent' : 'text-txt')}>
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-txt-dim block mb-1">Full name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="w-full h-10 px-3 bg-[#0a1518] border border-[rgba(255,255,255,0.06)] rounded-lg text-[13px] text-txt placeholder-txt-faint focus:outline-none focus:border-accent/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-txt-dim block mb-1">Work email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@company.com"
                      className="w-full h-10 px-3 bg-[#0a1518] border border-[rgba(255,255,255,0.06)] rounded-lg text-[13px] text-txt placeholder-txt-faint focus:outline-none focus:border-accent/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-txt-dim block mb-1">Organisation</label>
                  <input
                    type="text"
                    name="org"
                    value={form.org}
                    onChange={handleChange}
                    placeholder="Company name (optional)"
                    className="w-full h-10 px-3 bg-[#0a1518] border border-[rgba(255,255,255,0.06)] rounded-lg text-[13px] text-txt placeholder-txt-faint focus:outline-none focus:border-accent/40 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-txt-dim block mb-1">Message *</label>
                  <textarea
                    name="message"
                    required
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about your use case, organisation size, and what outcomes you're trying to achieve..."
                    className="w-full px-3 py-2.5 bg-[#0a1518] border border-[rgba(255,255,255,0.06)] rounded-lg text-[13px] text-txt placeholder-txt-faint focus:outline-none focus:border-accent/40 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !inquiryType || !form.name || !form.email || !form.message}
                  className="flex items-center justify-center gap-2 h-11 bg-accent text-[#050816] rounded-xl text-[13px] font-bold shadow-[0_0_20px_rgba(34,255,170,0.25)] hover:shadow-[0_0_30px_rgba(34,255,170,0.4)] hover:bg-accent-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-[#050816]/30 border-t-[#050816] rounded-full animate-spin" />
                  ) : (
                    <>Send Message <ArrowRight size={13} strokeWidth={2.8} /></>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
