'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MessageWithSender, ConversationWithDetails } from '@/lib/supabase/types';
import {
  getOrCreateSessionKey,
  ensurePublicKeyRegistered,
  encryptForDB,
  decryptFromDB,
} from '@/lib/e2e-crypto';

// ── useMessages ───────────────────────────────────────────────────────────────
// Loads messages for a conversation and subscribes to realtime updates.

async function decryptMessages(msgs: MessageWithSender[], conversationId: string): Promise<MessageWithSender[]> {
  return Promise.all(
    msgs.map(async (msg) => {
      if (!msg.is_encrypted || !msg.content || !msg.iv) return msg;
      const plaintext = await decryptFromDB(msg.content, msg.iv, conversationId);
      return { ...msg, content: plaintext };
    })
  );
}

export function useMessages(conversationId: string | null, userId: string | null) {
  const [messages, setMessages]   = useState<MessageWithSender[]>([]);
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  // Initialize session key and register public key on mount
  useEffect(() => {
    if (!conversationId || !userId) return;
    getOrCreateSessionKey(conversationId).catch(() => {});
    ensurePublicKeyRegistered(userId).catch(() => {});
  }, [conversationId, userId]);

  // Load initial messages
  useEffect(() => {
    if (!conversationId || !userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('messages')
        .select('*, sender:user_profiles!sender_id(display_name, avatar_url)')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!cancelled) {
        const raw = (data as MessageWithSender[]) ?? [];
        const decrypted = await decryptMessages(raw, conversationId!);
        setMessages(decrypted);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [conversationId, userId]);

  // Mark conversation as read on load
  useEffect(() => {
    if (!conversationId || !userId) return;
    const supabase = createClient();
    supabase
      .from('conversation_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .then(() => {});
  }, [conversationId, userId]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch sender profile for the new message
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('id', (payload.new as { sender_id: string }).sender_id)
            .single();

          let newMsg: MessageWithSender = {
            ...(payload.new as MessageWithSender),
            sender: profile ?? null,
          };

          // Decrypt if encrypted
          if (newMsg.is_encrypted && newMsg.content && newMsg.iv) {
            const plaintext = await decryptFromDB(newMsg.content, newMsg.iv, conversationId!);
            newMsg = { ...newMsg, content: plaintext };
          }

          setMessages((prev) => {
            // Deduplicate by id
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if this is someone else's message
          if ((payload.new as { sender_id: string }).sender_id !== userId) {
            supabase
              .from('conversation_members')
              .update({ last_read_at: new Date().toISOString() })
              .eq('conversation_id', conversationId)
              .eq('user_id', userId ?? '')
              .then(() => {});
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, userId]);

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!conversationId || !userId || !content.trim()) return false;
      setSending(true);

      const supabase = createClient();
      const trimmed = content.trim();

      // Attempt E2E encryption; fall back to plaintext if key unavailable
      const encrypted = await encryptForDB(trimmed, conversationId);
      const insertPayload = encrypted
        ? {
            conversation_id: conversationId,
            sender_id: userId,
            content: encrypted.content,
            iv: encrypted.iv,
            is_encrypted: true,
            message_type: 'text' as const,
          }
        : {
            conversation_id: conversationId,
            sender_id: userId,
            content: trimmed,
            iv: '',
            is_encrypted: false,
            message_type: 'text' as const,
          };

      const { error } = await supabase.from('messages').insert(insertPayload);

      setSending(false);
      return !error;
    },
    [conversationId, userId]
  );

  return { messages, loading, sending, sendMessage };
}

// ── useConversations ──────────────────────────────────────────────────────────
// Loads and subscribes to the user's conversation list.

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const supabase = createClient();

    // Get conversation IDs for this user, with last_read_at
    const { data: memberships } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (!memberships?.length) { setLoading(false); setConversations([]); return; }

    const convIds = memberships.map((m) => m.conversation_id);
    const readMap = Object.fromEntries(memberships.map((m) => [m.conversation_id, m.last_read_at]));

    // Load conversations with members + profiles
    const { data: convs } = await supabase
      .from('conversations')
      .select(`
        *,
        members:conversation_members!conversation_id(
          user_id, role, last_read_at,
          profile:user_profiles!user_id(display_name, avatar_url)
        )
      `)
      .in('id', convIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (!convs) { setLoading(false); return; }

    // Load last message per conversation
    const lastMsgResults = await Promise.all(
      convIds.map((cid) =>
        supabase
          .from('messages')
          .select('content, sender_id, created_at')
          .eq('conversation_id', cid)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          .then(({ data }) => ({ cid, msg: data }))
      )
    );
    const lastMsgMap = Object.fromEntries(
      lastMsgResults.map(({ cid, msg }) => [cid, msg])
    );

    // Count unread messages per conversation
    const unreadResults = await Promise.all(
      convIds.map(async (cid) => {
        const lastRead = readMap[cid];
        if (!lastRead) {
          // All messages unread if never read
          const { count } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', cid)
            .eq('is_deleted', false)
            .neq('sender_id', userId);
          return { cid, count: count ?? 0 };
        }
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', cid)
          .eq('is_deleted', false)
          .neq('sender_id', userId)
          .gt('created_at', lastRead);
        return { cid, count: count ?? 0 };
      })
    );
    const unreadMap = Object.fromEntries(unreadResults.map(({ cid, count }) => [cid, count]));

    const enriched: ConversationWithDetails[] = convs.map((c) => ({
      ...(c as ConversationWithDetails),
      last_message: lastMsgMap[c.id] ?? null,
      unread_count: unreadMap[c.id] ?? 0,
    }));

    setConversations(enriched);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // Realtime: refresh list when any conversation updates
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const channel = supabase
      .channel('conversations_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        load();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, load]);

  return { conversations, loading, reload: load };
}

// ── useTotalUnread ────────────────────────────────────────────────────────────
// Returns total unread count across all conversations (for nav badge).

export function useTotalUnread(userId: string | null): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    async function compute() {
      const { data: memberships } = await supabase
        .from('conversation_members')
        .select('conversation_id, last_read_at')
        .eq('user_id', userId);

      if (!memberships?.length) { setTotal(0); return; }

      let count = 0;
      await Promise.all(
        memberships.map(async (m) => {
          const query = supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', m.conversation_id)
            .eq('is_deleted', false)
            .neq('sender_id', userId);

          if (m.last_read_at) query.gt('created_at', m.last_read_at);
          const { count: c } = await query;
          count += c ?? 0;
        })
      );
      setTotal(count);
    }

    compute();

    const channel = supabase
      .channel('unread_badge')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        compute();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return total;
}
