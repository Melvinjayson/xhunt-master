'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, CheckCircle2, AlertCircle, Building2, Globe, Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { DbTenant } from '@/lib/supabase/types';

const ORG_TYPES = ['brand', 'enterprise', 'education', 'community'] as const;

export default function AdminSettingsPage() {
  const [tenant, setTenant] = useState<DbTenant | null>(null);
  const [name, setName] = useState('');
  const [orgType, setOrgType] = useState<string>('brand');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.tenant_id) return;

      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', profile.tenant_id)
        .single();

      if (data) {
        setTenant(data);
        setName(data.name);
        setOrgType(data.plan ?? 'brand');
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleSave() {
    if (!tenant || !name.trim()) return;
    setSaving(true);
    setError('');

    const { error } = await supabase
      .from('tenants')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', tenant.id);

    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[640px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[#e8f0fe]">Settings</h1>
          <p className="text-[#7a8fa8] text-sm mt-0.5">Manage your workspace configuration</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="flex items-center gap-2 h-10 px-5 bg-accent text-[#060a0e] rounded-xl font-semibold text-sm shadow-[0_4px_16px_rgba(0,230,118,0.35)] disabled:opacity-60"
        >
          {saved ? (
            <><CheckCircle2 size={15} strokeWidth={2.5} /> Saved</>
          ) : saving ? (
            <Loader2 size={15} strokeWidth={2} className="animate-spin" />
          ) : (
            <><Save size={15} strokeWidth={2} /> Save changes</>
          )}
        </motion.button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-[#2a0a0a] border border-[#ff5252]/30 rounded-xl px-4 py-3 mb-5">
          <AlertCircle size={15} className="text-[#ff5252]" strokeWidth={2} />
          <p className="text-[13px] text-[#ff5252]">{error}</p>
        </div>
      )}

      {/* Org details */}
      <div className="bg-[#111927] border border-[#1c2a3a] rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={16} className="text-[#7a8fa8]" strokeWidth={2} />
          <h2 className="text-[15px] font-bold text-[#e8f0fe]">Organization</h2>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-[12px] font-semibold text-[#7a8fa8] uppercase tracking-wider mb-1.5 block">
              Organization Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 bg-[#0f1824] border border-[#1c2a3a] rounded-xl px-4 text-[#e8f0fe] text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-[#7a8fa8] uppercase tracking-wider mb-1.5 block">
              Organization Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ORG_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setOrgType(type)}
                  className={`h-11 rounded-xl border text-sm font-semibold transition-all duration-150 capitalize ${
                    orgType === type
                      ? 'border-accent bg-accent-light text-accent'
                      : 'border-[#1c2a3a] bg-[#0f1824] text-[#7a8fa8] hover:border-[#2a3f58]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace info (read-only) */}
      <div className="bg-[#111927] border border-[#1c2a3a] rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-2 mb-5">
          <Globe size={16} className="text-[#7a8fa8]" strokeWidth={2} />
          <h2 className="text-[15px] font-bold text-[#e8f0fe]">Workspace Info</h2>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center py-3 border-b border-[#1c2a3a]">
            <span className="text-[13px] text-[#7a8fa8]">Workspace ID</span>
            <span className="text-[13px] font-mono text-[#e8f0fe] text-right truncate max-w-[240px]">{tenant?.id ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-[#1c2a3a]">
            <span className="text-[13px] text-[#7a8fa8]">Slug</span>
            <span className="text-[13px] font-mono text-[#e8f0fe]">{tenant?.slug ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-[13px] text-[#7a8fa8]">Created</span>
            <span className="text-[13px] text-[#e8f0fe]">
              {tenant ? new Date(tenant.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Plan */}
      <div className="bg-[#111927] border border-[#1c2a3a] rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag size={16} className="text-[#7a8fa8]" strokeWidth={2} />
          <h2 className="text-[15px] font-bold text-[#e8f0fe]">Plan</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-[#e8f0fe] capitalize">{tenant?.plan ?? 'Free'}</p>
            <p className="text-[12px] text-[#7a8fa8] mt-0.5">Current billing plan</p>
          </div>
          <span className="px-3 py-1.5 bg-accent-light border border-accent/30 text-accent text-[12px] font-bold rounded-lg uppercase tracking-wider">
            {tenant?.plan ?? 'Free'}
          </span>
        </div>
      </div>
    </div>
  );
}
