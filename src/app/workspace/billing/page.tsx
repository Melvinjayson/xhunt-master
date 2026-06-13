'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, TrendingUp, FileText, ArrowUpRight, Download,
  Sparkles, Users, Zap, Check, ChevronRight, BarChart3, DollarSign,
  Calendar, Shield
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import type { DbRevenueRecord, DbInvoice } from '@/lib/supabase/types';

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-[#0D1530] animate-pulse rounded-lg', className)} />;
}

const INVOICE_STATUS = {
  draft:         { label: 'Draft',    color: 'text-[#4A5578]',  bg: 'bg-[#4A5578]/10'  },
  open:          { label: 'Open',     color: 'text-[#FFB84D]',  bg: 'bg-[#FFB84D]/10'  },
  paid:          { label: 'Paid',     color: 'text-[#22FFAA]',  bg: 'bg-[#22FFAA]/10'  },
  void:          { label: 'Void',     color: 'text-[#8B9CC0]',  bg: 'bg-[#8B9CC0]/10'  },
  uncollectible: { label: 'Overdue',  color: 'text-[#FF5C7A]',  bg: 'bg-[#FF5C7A]/10'  },
};

const PLANS = [
  {
    id: 'starter', name: 'Starter', price: '$0', period: 'forever',
    features: ['5 missions', '50 participants', '1 admin seat', 'Basic analytics'],
    cta: 'Current Plan',
  },
  {
    id: 'growth', name: 'Growth', price: '$299', period: '/mo',
    features: ['Unlimited missions', '1,000 participants', '5 admin seats', 'Advanced analytics', 'AI Agents (100 req/day)', 'Priority support'],
    cta: 'Upgrade to Growth',
    highlight: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 'Custom', period: '',
    features: ['Unlimited everything', 'Unlimited participants', 'Unlimited seats', 'Custom AI credits', 'SSO + SCIM', 'Dedicated success manager', 'SLA guarantee'],
    cta: 'Contact Sales',
  },
];

export default function BillingPage() {
  const [revenues, setRevenues] = useState<DbRevenueRecord[]>([]);
  const [invoices, setInvoices] = useState<DbInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>('starter');
  const [totalUsers, setTotalUsers] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from('user_profiles').select('tenant_id').eq('id', user.id).single();
      if (!profile?.tenant_id) return;

      const [tenantRes, revenueRes, invoiceRes, usersRes] = await Promise.all([
        supabase.from('tenants').select('plan').eq('id', profile.tenant_id).single(),
        supabase.from('revenue_records').select('*').eq('tenant_id', profile.tenant_id).order('recognized_at', { ascending: false }).limit(20),
        supabase.from('invoices').select('*').eq('tenant_id', profile.tenant_id).order('issued_at', { ascending: false }).limit(10),
        supabase.from('user_profiles').select('id', { count: 'exact' }).eq('tenant_id', profile.tenant_id),
      ]);

      setCurrentPlan(tenantRes.data?.plan ?? 'starter');
      setRevenues(revenueRes.data ?? []);
      setInvoices(invoiceRes.data ?? []);
      setTotalUsers(usersRes.count ?? 0);
      setLoading(false);
    }
    load();
  }, [supabase]);

  const totalRevenue = revenues.reduce((s, r) => s + r.amount_cents, 0) / 100;
  const thisMonthRevenue = revenues
    .filter((r) => new Date(r.recognized_at).getMonth() === new Date().getMonth())
    .reduce((s, r) => s + r.amount_cents, 0) / 100;

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22FFAA]/8 border border-[#22FFAA]/15 flex items-center justify-center">
            <CreditCard size={18} className="text-[#22FFAA]" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-[#F0F4FF]">Billing & Usage</h1>
            <p className="text-[#4A5578] text-[12px]">
              Current plan: <span className="text-[#22FFAA] font-semibold capitalize">{currentPlan}</span>
            </p>
          </div>
        </div>
        <Link href="/admin/revenue">
          <button className="flex items-center gap-2 h-9 px-4 bg-[#0A1226] border border-[#162440] text-[#F0F4FF] rounded-xl font-medium text-[13px] hover:border-[#22FFAA]/30 transition-colors">
            <DollarSign size={13} strokeWidth={2} />
            Revenue Dashboard
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Revenue This Month', value: `$${thisMonthRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-[#22FFAA]', bg: 'bg-[#22FFAA]/8',  trend: 18 },
          { label: 'Total Revenue',      value: `$${totalRevenue.toFixed(2)}`,     icon: DollarSign, color: 'text-[#6D5DFD]', bg: 'bg-[#6D5DFD]/10', trend: 12 },
          { label: 'Active Seats',       value: totalUsers,                         icon: Users,      color: 'text-[#FFB84D]', bg: 'bg-[#FFB84D]/10', trend: 5  },
        ].map(({ label, value, icon: Icon, color, bg, trend }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', bg)}>
                <Icon size={16} className={color} strokeWidth={1.8} />
              </div>
              <span className={cn('text-[11px] font-bold flex items-center gap-0.5', trend >= 0 ? 'text-[#22FFAA]' : 'text-[#FF5C7A]')}>
                <ArrowUpRight size={11} strokeWidth={2.5} />
                {Math.abs(trend)}%
              </span>
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
            <p className="text-[#4A5578] text-[11px] mt-0.5 font-medium">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Plan Comparison */}
      <div>
        <p className="text-[13px] font-bold text-[#F0F4FF] mb-4">Plans</p>
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                'bg-[#0A1226] border rounded-2xl p-5 relative',
                plan.highlight ? 'border-accent/30' : 'border-[#0F1D35]',
                currentPlan === plan.id && 'ring-1 ring-accent/20'
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-[#060a0e] text-[10px] font-bold rounded-full">
                  RECOMMENDED
                </div>
              )}
              {currentPlan === plan.id && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-[#22FFAA]/10 border border-[#22FFAA]/20 rounded-full">
                  <div className="w-1 h-1 rounded-full bg-[#22FFAA] breathe" />
                  <span className="text-[9px] font-bold text-[#22FFAA]">Active</span>
                </div>
              )}

              <div className="mb-4">
                <p className="text-[16px] font-bold text-[#F0F4FF]">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[28px] font-bold text-[#F0F4FF]">{plan.price}</span>
                  {plan.period && <span className="text-[13px] text-[#4A5578]">{plan.period}</span>}
                </div>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[12px] text-[#8B9CC0]">
                    <Check size={12} className="text-[#22FFAA] flex-shrink-0" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={currentPlan === plan.id}
                className={cn(
                  'w-full h-9 rounded-xl text-[12px] font-semibold transition-all',
                  currentPlan === plan.id
                    ? 'bg-[#07101F] border border-[#0F1D35] text-[#4A5578] cursor-default'
                    : plan.highlight
                      ? 'bg-accent text-[#060a0e] shadow-[0_4px_16px_rgba(34,255,170,0.25)]'
                      : 'bg-[#0D1530] border border-[#162440] text-[#F0F4FF] hover:border-[#6D5DFD]/30'
                )}
              >
                {currentPlan === plan.id ? 'Current Plan' : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-[#0A1226] border border-[#0F1D35] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#0F1D35]">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[#6D5DFD]" strokeWidth={2} />
            <p className="text-[13px] font-bold text-[#F0F4FF]">Invoices</p>
          </div>
        </div>
        {invoices.length === 0 ? (
          <div className="py-12 text-center">
            <FileText size={24} className="text-[#4A5578] mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-[#8B9CC0] font-medium">No invoices yet</p>
            <p className="text-[#4A5578] text-sm mt-1">Your billing history will appear here.</p>
          </div>
        ) : (
          <>
            <div className="grid px-5 py-3 border-b border-[#0F1D35] bg-[#07101F]"
              style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 80px' }}>
              {['Invoice', 'Amount', 'Status', 'Issued', ''].map((h) => (
                <p key={h} className="text-[10px] font-bold text-[#4A5578] uppercase tracking-wider">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-[#0F1D35]">
              {invoices.map((inv) => {
                const sc = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.draft;
                return (
                  <div key={inv.id} className="grid px-5 py-4 items-center hover:bg-[#0D1530] transition-colors"
                    style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 80px' }}>
                    <p className="text-[12px] font-semibold text-[#F0F4FF]">{inv.invoice_number}</p>
                    <p className="text-[13px] font-bold text-[#F0F4FF] tabular-nums">
                      ${(inv.amount_cents / 100).toFixed(2)}
                    </p>
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full w-fit', sc.color, sc.bg)}>{sc.label}</span>
                    <p className="text-[11px] text-[#4A5578]">
                      {new Date(inv.issued_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <button className="flex items-center gap-1 text-[11px] text-[#8B9CC0] hover:text-accent transition-colors font-medium">
                      <Download size={11} strokeWidth={2} />PDF
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
