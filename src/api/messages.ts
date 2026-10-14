import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FALLBACK_POLL_MS } from '../lib/constants';
import { supabase, unwrap } from '../lib/supabase';
import type { Conversation, Message } from '../types';

const CONVERSATION_SELECT = `*,
  buyer:profiles!conversations_buyer_id_fkey(name),
  seller:profiles!conversations_seller_id_fkey(name),
  listing:listings(id, title, price, photos, status, condition)`;

export const messageKeys = {
  conversations: ['conversations'] as const,
  thread: (id: string) => ['messages', id] as const,
};

const lastActivity = (c: Conversation) => c.last_message_at ?? c.created_at;

/** The signed-in user's conversations, most recent first. RLS returns only their own. */
export function useConversations(enabled: boolean) {
  return useQuery({
    queryKey: messageKeys.conversations,
    enabled,
    refetchInterval: FALLBACK_POLL_MS,
    queryFn: async () => {
      const rows = unwrap<Conversation[]>(await supabase.from('conversations').select(CONVERSATION_SELECT));
      return rows.sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
    },
  });
}

export function isUnread(c: Conversation, userId: string): boolean {
  if (!c.last_message_at || c.last_message_sender === userId) return false;
  const readAt = c.buyer_id === userId ? c.buyer_read_at : c.seller_read_at;
  return new Date(c.last_message_at) > new Date(readAt);
}

export function otherParty(c: Conversation, userId: string) {
  const iAmBuyer = c.buyer_id === userId;
  return { name: (iAmBuyer ? c.seller : c.buyer)?.name ?? 'Student', iAmBuyer };
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: messageKeys.thread(conversationId ?? ''),
    enabled: !!conversationId,
    refetchInterval: FALLBACK_POLL_MS,
    queryFn: async () =>
      unwrap<Message[]>(
        await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId!)
          .order('created_at', { ascending: true }),
      ),
  });
}

export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      unwrap(await supabase.from('messages').insert({ conversation_id: conversationId, body }).select('id').single());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messageKeys.thread(conversationId) });
      qc.invalidateQueries({ queryKey: messageKeys.conversations });
    },
  });
}

/** Opens (or reuses) the buyer's conversation about a listing. Returns its id. */
export async function startConversation(listingId: string): Promise<string> {
  return unwrap<string>(await supabase.rpc('start_conversation', { p_listing_id: listingId }));
}

export async function markConversationRead(conversationId: string): Promise<void> {
  unwrap(await supabase.rpc('mark_conversation_read', { p_conversation_id: conversationId }));
}
